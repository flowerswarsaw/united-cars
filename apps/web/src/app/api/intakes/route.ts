import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

// Enhanced intake validation schema
const IntakeCreateSchema = z.object({
  auction: z.enum(['COPART', 'IAA', 'MANHEIM', 'PRIVATE']),
  auctionLot: z.string().optional(),
  vin: z.string().min(11).max(20),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  purchasePriceUSD: z.number().min(0).optional(),
  auctionLocationId: z.string().optional(),
  usPort: z.string().min(1),
  destinationPort: z.string().min(1),
  insurance: z.string().default('1%'),
  paymentMethod: z.enum(['DIRECT_TO_AUCTION', 'COMPANY_PAYS']),
  isPrivateLocation: z.boolean().default(false),
  pickupAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  insuranceValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  paymentConfirmations: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string(),
    uploadedAt: z.date()
  })).default([])
})

// GET /api/intakes - List intakes for current org with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '25')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const roles = session.user.roles || []

    const skip = (page - 1) * perPage

    // Build filter for mock database
    const filter: any = {
      where: {},
      skip,
      take: perPage
    }
    
    if (roles.includes('ADMIN') || roles.includes('OPS')) {
      // Admin/Ops can see all intakes
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        filter.where.status = status
      }
    } else {
      // Dealers can only see their own org's intakes
      filter.where.orgId = session.user.orgId
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        filter.where.status = status
      }
    }

    // Add search filter
    if (search) {
      filter.where.OR = [
        { vin: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } }
      ]
    }

    // Get intakes using mock database
    const intakes = await db.vehicleIntakes.findMany(filter)
    const total = intakes.length

    // Get status counts for current user/org
    const baseFilter = roles.includes('ADMIN') || roles.includes('OPS') 
      ? {} 
      : { orgId: session.user.orgId }

    const allIntakes = await db.vehicleIntakes.findMany({ where: baseFilter })
    
    // Calculate status counts
    const statusCounts = {
      all: allIntakes.length,
      PENDING: allIntakes.filter(i => i.status === 'PENDING').length,
      APPROVED: allIntakes.filter(i => i.status === 'APPROVED').length,
      REJECTED: allIntakes.filter(i => i.status === 'REJECTED').length
    }

    return NextResponse.json({
      intakes,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
    })
  } catch (error) {
    console.error('List intakes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/intakes - Create new intake
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    if (!roles.includes('DEALER') && !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input with enhanced schema
    const input = IntakeCreateSchema.parse(body)
    
    // Validate private location fields if needed
    if (input.isPrivateLocation) {
      if (!input.pickupAddress || !input.contactPerson || !input.contactPhone) {
        return NextResponse.json({ 
          error: 'Private location requires pickup address, contact person, and contact phone' 
        }, { status: 400 })
      }
    }
    
    // Create intake using mock database
    const intakeData = {
      ...input,
      orgId: session.user.orgId!,
      createdById: session.user.id,
      status: 'PENDING' as const,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedById: null
    }

    const intake = await db.vehicleIntakes.create(intakeData)

    return NextResponse.json({ success: true, intake }, { status: 201 })
  } catch (error: any) {
    console.error('Create intake error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}