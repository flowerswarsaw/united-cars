import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

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

    // Build filter for mock database (without pagination first)
    const filter: any = {
      where: {}
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all claims
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      filter.where.status = status
    }

    // Add search filter - search by vehicle VIN, make, model, year
    if (search) {
      const searchNum = parseInt(search)
      const vehicles = await db.vehicles.findMany({
        where: {
          OR: [
            { vin: { contains: search } },
            { make: { contains: search } },
            { model: { contains: search } },
            ...(searchNum > 1800 && searchNum < 2100 ? [{ year: searchNum }] : [])
          ]
        }
      })
      if (vehicles.data.length > 0) {
        filter.where.vehicleId = { in: vehicles.data.map((v: any) => v.id) }
      } else {
        // No matching vehicles, return empty result
        filter.where.vehicleId = 'no-match'
      }
    }

    // Get all matching claims first to get the total count
    const allClaims = await db.insuranceClaims.findMany(filter)
    const total = allClaims.length

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const paginatedClaims = allClaims.slice(startIndex, startIndex + perPage)

    // Get status counts for filter buttons (always get counts for all statuses)
    const statusCountFilter: any = {
      where: {}
    }
    
    // Apply same org scoping for counts
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all claims
    } else {
      statusCountFilter.where.orgId = session.user.orgId
    }

    const allUserClaims = await db.insuranceClaims.findMany(statusCountFilter)
    const statusCounts = {
      all: allUserClaims.length,
      new: allUserClaims.filter(c => c.status === 'new').length,
      investigating: allUserClaims.filter(c => c.status === 'investigating').length,
      under_review: allUserClaims.filter(c => c.status === 'under_review').length,
      approved: allUserClaims.filter(c => c.status === 'approved').length,
      rejected: allUserClaims.filter(c => c.status === 'rejected').length,
      settled: allUserClaims.filter(c => c.status === 'settled').length,
      paid: allUserClaims.filter(c => c.status === 'paid').length,
      closed: allUserClaims.filter(c => c.status === 'closed').length,
    }

    return NextResponse.json({
      success: true,
      claims: paginatedClaims,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
    })

  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    if (!roles.includes('DEALER') && !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Verify vehicle belongs to dealer's org (unless admin)
    if (!roles.includes('ADMIN')) {
      const vehicle = await db.vehicles.findById(body.vehicleId)

      if (!vehicle || vehicle.orgId !== session.user.orgId) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
      }
    }

    // Create insurance claim using mock database
    const claimData = {
      vehicleId: body.vehicleId,
      orgId: session.user.orgId!,
      description: body.description,
      incidentAt: new Date(), // Automatically set to current timestamp
      photos: body.photos || null,
      status: 'new' as const
    }

    const claim = await db.insuranceClaims.create(claimData)

    return NextResponse.json(
      { success: true, claim }, 
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}