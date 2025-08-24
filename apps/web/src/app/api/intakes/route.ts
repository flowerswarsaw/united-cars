import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { IntakeCreateInput } from '@united-cars/core'
import { getSession } from '@/lib/auth-utils'

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

    return NextResponse.json({
      intakes,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
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
    
    // Validate input
    const input = IntakeCreateInput.parse(body)
    
    // Create intake using mock database
    const intakeData = {
      ...input,
      orgId: session.user.orgId!,
      createdById: session.user.id,
      status: 'PENDING' as const
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