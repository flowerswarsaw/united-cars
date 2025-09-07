import { NextRequest, NextResponse } from 'next/server'
import { 
  ports,
  auctionLocations,
  getRoutesToPort
} from '@united-cars/mock-data'

// GET: Fetch all ports with their usage statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')
    const country = searchParams.get('country')

    let filteredPorts = [...ports]

    // Filter by state
    if (state) {
      filteredPorts = filteredPorts.filter(port => port.state === state)
    }

    // Filter by country
    if (country) {
      filteredPorts = filteredPorts.filter(port => port.country === country)
    }

    // Enhance ports with usage statistics
    const enhancedPorts = filteredPorts.map(port => {
      const routeCount = getRoutesToPort(port.id).length
      const preferredByLocations = auctionLocations.filter(loc => loc.preferredPortId === port.id)
      
      return {
        ...port,
        routeCount,
        preferredByCount: preferredByLocations.length,
        preferredByLocations: preferredByLocations.map(loc => ({
          id: loc.id,
          auction: loc.auction,
          name: loc.name,
          state: loc.state,
        })),
      }
    })

    // Sort by usage (route count + preferred by count)
    const sortedPorts = enhancedPorts.sort((a, b) => {
      const aUsage = a.routeCount + a.preferredByCount
      const bUsage = b.routeCount + b.preferredByCount
      return bUsage - aUsage
    })

    return NextResponse.json({
      success: true,
      data: {
        ports: sortedPorts,
        totalCount: sortedPorts.length,
        stats: {
          totalRoutes: sortedPorts.reduce((sum, p) => sum + p.routeCount, 0),
          totalPreferences: sortedPorts.reduce((sum, p) => sum + p.preferredByCount, 0),
          mostUsedPort: sortedPorts[0] || null,
        }
      }
    })

  } catch (error) {
    console.error('Error fetching ports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ports' },
      { status: 500 }
    )
  }
}