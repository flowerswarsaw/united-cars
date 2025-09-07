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
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build filter for mock database (without pagination first)
    const filter: any = {
      where: {}
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all service requests
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      filter.where.status = status
    }

    // Apply type filter if provided  
    if (type && type !== 'all') {
      filter.where.type = type
    }

    // Add search filter - search by vehicle VIN, make, model
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

    // Get all matching service requests first to get the total count
    const allServiceRequests = await db.serviceRequests.findMany(filter)
    const total = allServiceRequests.length

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const paginatedServiceRequests = allServiceRequests.slice(startIndex, startIndex + perPage)

    // Get contextual counts for filter buttons
    const countFilter: any = {
      where: {}
    }
    
    // Apply same org scoping for counts
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all service requests
    } else {
      countFilter.where.orgId = session.user.orgId
    }

    // For counts, get all requests (don't apply current filters - show total available)
    const allRequestsForCounts = await db.serviceRequests.findMany(countFilter)
    
    // Status counts: show total available for each status (no type filter applied)
    const statusFilteredRequests = allRequestsForCounts
    
    // Type counts: show total available for each type (no status filter applied)
    const typeFilteredRequests = allRequestsForCounts
    
    const statusCounts = {
      all: statusFilteredRequests.length,
      pending: statusFilteredRequests.filter(s => s.status === 'pending').length,
      approved: statusFilteredRequests.filter(s => s.status === 'approved').length,
      in_progress: statusFilteredRequests.filter(s => s.status === 'in_progress').length,
      completed: statusFilteredRequests.filter(s => s.status === 'completed').length,
      rejected: statusFilteredRequests.filter(s => s.status === 'rejected').length,
      cancelled: statusFilteredRequests.filter(s => s.status === 'cancelled').length,
    }

    const typeCounts = {
      all: typeFilteredRequests.length,
      video_service: typeFilteredRequests.filter(s => s.type === 'video_service').length,
      vip_full: typeFilteredRequests.filter(s => s.type === 'vip_full').length,
      vip_fastest: typeFilteredRequests.filter(s => s.type === 'vip_fastest').length,
      plastic_covering: typeFilteredRequests.filter(s => s.type === 'plastic_covering').length,
      extra_photos: typeFilteredRequests.filter(s => s.type === 'extra_photos').length,
      window_covering: typeFilteredRequests.filter(s => s.type === 'window_covering').length,
      moisture_absorber: typeFilteredRequests.filter(s => s.type === 'moisture_absorber').length,
    }

    return NextResponse.json({
      success: true,
      serviceRequests: paginatedServiceRequests,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts,
      typeCounts
    })

  } catch (error) {
    console.error('Error fetching service requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
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

    // Create service request using mock database
    const enrichedServiceRequest = await db.serviceRequests.create({
      vehicleId: body.vehicleId,
      orgId: session.user.orgId!,
      type: body.type,
      notes: body.notes || null,
      priceUSD: body.priceUSD || null
    })

    return NextResponse.json(
      { success: true, serviceRequest: enrichedServiceRequest }, 
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating service request:', error)
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}