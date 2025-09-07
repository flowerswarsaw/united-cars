import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// GET: Fetch all towing rules with related data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const auctionSource = searchParams.get('auction')
    const shipperId = searchParams.get('shipper')
    const portId = searchParams.get('port')

    const where: any = {}
    
    if (auctionSource) {
      where.auctionLocation = {
        auction: auctionSource
      }
    }
    
    if (shipperId) {
      where.shipperId = shipperId
    }
    
    if (portId) {
      where.deliveryPortId = portId
    }

    const towingRules = await prisma.towingRule.findMany({
      where,
      include: {
        auctionLocation: true,
        deliveryPort: true,
        shipper: true,
      },
      orderBy: [
        { auctionLocation: { auction: 'asc' } },
        { auctionLocation: { name: 'asc' } },
        { deliveryPort: { name: 'asc' } },
      ],
    })

    return NextResponse.json({
      success: true,
      data: towingRules,
    })
  } catch (error) {
    console.error('Error fetching towing rules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch towing rules' },
      { status: 500 }
    )
  }
}

// POST: Create a new towing rule
const CreateTowingRuleSchema = z.object({
  shipperId: z.string(),
  auctionLocationId: z.string(),
  deliveryPortId: z.string(),
  ruleType: z.enum(['FLAT', 'MULTIPLIER', 'CATEGORY']),
  basePrice: z.number().min(0),
  perTypeJson: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateTowingRuleSchema.parse(body)

    // Check if rule already exists
    const existingRule = await prisma.towingRule.findUnique({
      where: {
        shipperId_auctionLocationId_deliveryPortId: {
          shipperId: validatedData.shipperId,
          auctionLocationId: validatedData.auctionLocationId,
          deliveryPortId: validatedData.deliveryPortId,
        },
      },
    })

    if (existingRule) {
      return NextResponse.json(
        { success: false, error: 'Towing rule already exists for this route' },
        { status: 409 }
      )
    }

    const towingRule = await prisma.towingRule.create({
      data: validatedData,
      include: {
        auctionLocation: true,
        deliveryPort: true,
        shipper: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: towingRule,
    })
  } catch (error) {
    console.error('Error creating towing rule:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create towing rule' },
      { status: 500 }
    )
  }
}