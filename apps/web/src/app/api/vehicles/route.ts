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
      // Admin can see all vehicles
    } else {
      filter.where.orgId = session.user.orgId
    }

    // Add status filter
    if (status && status !== 'all') {
      filter.where.status = status
    }

    // Add search filter
    if (search) {
      filter.where.OR = [
        { vin: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } }
      ]
    }

    // Get all matching vehicles first to get the total count
    const allVehicles = await db.vehicles.findMany(filter)
    const total = allVehicles.data.length

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const paginatedVehicles = allVehicles.data.slice(startIndex, startIndex + perPage)

    // Get status counts for filter buttons (always get counts for all statuses)
    const statusCountFilter: any = {
      where: {}
    }
    
    // Apply same org scoping for counts
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all vehicles
    } else {
      statusCountFilter.where.orgId = session.user.orgId
    }

    const allUserVehicles = await db.vehicles.findMany(statusCountFilter)
    const statusCounts = {
      all: allUserVehicles.data.length,
      SOURCING: allUserVehicles.data.filter(v => v.status === 'SOURCING').length,
      PICKUP: allUserVehicles.data.filter(v => v.status === 'PICKUP').length,
      GROUND_TRANSPORT: allUserVehicles.data.filter(v => v.status === 'GROUND_TRANSPORT').length,
      PORT_PROCESSING: allUserVehicles.data.filter(v => v.status === 'PORT_PROCESSING').length,
      OCEAN_SHIPPING: allUserVehicles.data.filter(v => v.status === 'OCEAN_SHIPPING').length,
      DESTINATION_PORT: allUserVehicles.data.filter(v => v.status === 'DESTINATION_PORT').length,
      DELIVERED: allUserVehicles.data.filter(v => v.status === 'DELIVERED').length,
    }

    return NextResponse.json({
      success: true,
      vehicles: paginatedVehicles,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
    })

  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}