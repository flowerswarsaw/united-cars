import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

// GET /api/titles - List titles for current org with pagination and search
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
    
    // For titles, we need to filter by vehicle ownership since titles don't have direct orgId
    let allowedVehicleIds: string[] = []
    
    if (roles.includes('ADMIN') || roles.includes('OPS')) {
      // Admin/Ops can see all titles
      const allVehicles = await db.vehicles.findMany({})
      allowedVehicleIds = allVehicles.data.map((v: any) => v.id)
    } else {
      // Dealers can only see their own org's vehicles' titles
      const orgVehicles = await db.vehicles.findMany({
        where: { orgId: session.user.orgId }
      })
      allowedVehicleIds = orgVehicles.data.map((v: any) => v.id)
    }

    // Add vehicle filter
    filter.where.vehicleId = { in: allowedVehicleIds }

    // Add status filter
    if (status && status !== 'all') {
      filter.where.status = status
    }

    // Add search filter - search by vehicle VIN
    if (search) {
      const matchingVehicles = await db.vehicles.findMany({
        where: {
          OR: [
            { vin: { contains: search } },
            { make: { contains: search } },
            { model: { contains: search } }
          ]
        }
      })
      
      const searchVehicleIds = matchingVehicles.data
        .filter((v: any) => allowedVehicleIds.includes(v.id))
        .map((v: any) => v.id)
      
      if (searchVehicleIds.length > 0) {
        filter.where.vehicleId = { in: searchVehicleIds }
      } else {
        // No matching vehicles, return empty result
        filter.where.vehicleId = 'no-match'
      }
    }

    // Get titles using mock database
    const titles = await db.titles.findMany(filter)
    const total = titles.length

    // Get status counts for filter buttons
    const statusCountFilter: any = {
      where: {}
    }
    
    // Apply same vehicle filtering for counts
    if (allowedVehicleIds.length > 0) {
      statusCountFilter.where.vehicleId = { in: allowedVehicleIds }
    }

    const allUserTitles = await db.titles.findMany(statusCountFilter)
    const statusCounts = {
      all: allUserTitles.length,
      pending: allUserTitles.filter(t => t.status === 'pending').length,
      received: allUserTitles.filter(t => t.status === 'received').length,
      packed: allUserTitles.filter(t => t.status === 'packed').length,
      sent: allUserTitles.filter(t => t.status === 'sent').length,
    }

    return NextResponse.json({
      titles,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
    })
  } catch (error) {
    console.error('List titles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}