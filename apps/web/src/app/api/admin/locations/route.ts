import { NextRequest, NextResponse } from 'next/server'
import { 
  auctionLocations,
  ports,
  updateLocationPreferredPort,
  getRoutesForLocation
} from '@united-cars/mock-data'
import { z } from 'zod'

// GET: Fetch all auction locations with their relationships
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const auction = searchParams.get('auction')
    const state = searchParams.get('state')
    const hasPreferredPort = searchParams.get('hasPreferredPort')

    let filteredLocations = [...auctionLocations]

    // Filter by auction house
    if (auction) {
      filteredLocations = filteredLocations.filter(loc => loc.auction === auction)
    }

    // Filter by state
    if (state) {
      filteredLocations = filteredLocations.filter(loc => loc.state === state)
    }

    // Filter by preferred port presence
    if (hasPreferredPort === 'true') {
      filteredLocations = filteredLocations.filter(loc => loc.preferredPortId !== null)
    } else if (hasPreferredPort === 'false') {
      filteredLocations = filteredLocations.filter(loc => loc.preferredPortId === null)
    }

    // Enhance locations with port details and route counts
    const enhancedLocations = filteredLocations.map(location => {
      const preferredPort = location.preferredPortId 
        ? ports.find(p => p.id === location.preferredPortId) 
        : null
      
      const routeCount = getRoutesForLocation(location.id).length

      return {
        ...location,
        preferredPort,
        routeCount,
      }
    })

    // Group by auction house for easier consumption
    const groupedByAuction = enhancedLocations.reduce((acc, location) => {
      if (!acc[location.auction]) {
        acc[location.auction] = []
      }
      acc[location.auction].push(location)
      return acc
    }, {} as Record<string, typeof enhancedLocations>)

    return NextResponse.json({
      success: true,
      data: {
        locations: enhancedLocations,
        groupedByAuction,
        totalCount: enhancedLocations.length,
        stats: {
          withPreferredPort: enhancedLocations.filter(l => l.preferredPortId).length,
          withoutPreferredPort: enhancedLocations.filter(l => !l.preferredPortId).length,
        }
      }
    })

  } catch (error) {
    console.error('Error fetching auction locations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auction locations' },
      { status: 500 }
    )
  }
}

// PATCH: Update preferred ports for auction locations
const UpdatePreferredPortsSchema = z.object({
  updates: z.array(z.object({
    locationId: z.string(),
    preferredPortId: z.string().nullable(),
  })),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = UpdatePreferredPortsSchema.parse(body)

    const updatedLocations: any[] = []
    
    for (const update of validatedData.updates) {
      const updatedLocation = updateLocationPreferredPort(update.locationId, update.preferredPortId)
      
      if (updatedLocation) {
        // Enhance with port details
        const preferredPort = updatedLocation.preferredPortId 
          ? ports.find(p => p.id === updatedLocation.preferredPortId) 
          : null
        
        updatedLocations.push({
          ...updatedLocation,
          preferredPort,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedLocations,
        updatedCount: updatedLocations.length,
      },
      message: `Updated preferred ports for ${updatedLocations.length} locations`,
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