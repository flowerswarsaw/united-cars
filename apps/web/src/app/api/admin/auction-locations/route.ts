import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// GET: Fetch all auction locations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const auction = searchParams.get('auction')
    const state = searchParams.get('state')
    const hasPreferredPort = searchParams.get('hasPreferredPort')

    const where: any = {}
    
    if (auction) {
      where.auction = auction
    }
    
    if (state) {
      where.state = state
    }
    
    if (hasPreferredPort === 'true') {
      where.preferredPortId = { not: null }
    } else if (hasPreferredPort === 'false') {
      where.preferredPortId = null
    }

    const auctionLocations = await prisma.auctionLocation.findMany({
      where,
      include: {
        preferredPort: true,
        towingRules: {
          include: {
            deliveryPort: true,
            shipper: true,
          },
        },
      },
      orderBy: [
        { auction: 'asc' },
        { state: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: auctionLocations,
    })
  } catch (error) {
    console.error('Error fetching auction locations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction locations' },
      { status: 500 }
    )
  }
}

// POST: Create a new auction location
const CreateAuctionLocationSchema = z.object({
  auction: z.enum(['COPART', 'IAA', 'MANHEIM', 'ADESA']),
  code: z.string().min(1),
  name: z.string().min(1),
  state: z.string().optional(),
  country: z.string().default('US'),
  preferredPortId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateAuctionLocationSchema.parse(body)

    // Check if location already exists
    const existingLocation = await prisma.auctionLocation.findUnique({
      where: {
        auction_code: {
          auction: validatedData.auction,
          code: validatedData.code,
        },
      },
    })

    if (existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Auction location already exists' },
        { status: 409 }
      )
    }

    const auctionLocation = await prisma.auctionLocation.create({
      data: validatedData,
      include: {
        preferredPort: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: auctionLocation,
    })
  } catch (error) {
    console.error('Error creating auction location:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create auction location' },
      { status: 500 }
    )
  }
}

// PATCH: Update preferred ports for multiple auction locations
const UpdatePreferredPortsSchema = z.object({
  updates: z.array(z.object({
    auctionLocationId: z.string(),
    preferredPortId: z.string().nullable(),
  })),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = UpdatePreferredPortsSchema.parse(body)

    const updatePromises = validatedData.updates.map((update) =>
      prisma.auctionLocation.update({
        where: { id: update.auctionLocationId },
        data: { preferredPortId: update.preferredPortId },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Updated preferred ports for ${validatedData.updates.length} locations`,
    })
  } catch (error) {
    console.error('Error updating preferred ports:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update preferred ports' },
      { status: 500 }
    )
  }
}