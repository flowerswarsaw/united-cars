import { NextRequest, NextResponse } from 'next/server'
import { 
  towingRoutes, 
  auctionLocations,
  ports, 
  vehicleTypes,
  getTowingRoute,
  updateTowingRoute,
  createTowingRoute,
  getLocationById,
  getPortById
} from '@united-cars/mock-data'
import { z } from 'zod'

// GET: Fetch all towing matrices with filter options
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const auctionFilter = searchParams.get('auction')
    const locationFilter = searchParams.get('location')
    const portFilter = searchParams.get('port')

    let filteredRoutes = [...towingRoutes]

    // Filter by auction house if specified
    if (auctionFilter) {
      filteredRoutes = filteredRoutes.filter(route => {
        const location = getLocationById(route.auctionLocationId)
        return location?.auction === auctionFilter
      })
    }

    // Filter by specific location if specified
    if (locationFilter) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.auctionLocationId === locationFilter
      )
    }

    // Filter by specific port if specified
    if (portFilter) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.deliveryPortId === portFilter
      )
    }

    // Enhance routes with location and port details
    const enhancedRoutes = filteredRoutes.map(route => {
      const location = getLocationById(route.auctionLocationId)
      const port = getPortById(route.deliveryPortId)
      
      return {
        ...route,
        auctionLocation: location,
        deliveryPort: port,
        vehiclePricingCount: Object.keys(route.vehiclePrices).length
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        routes: enhancedRoutes,
        totalCount: enhancedRoutes.length,
        metadata: {
          auctionLocations: auctionLocations.length,
          ports: ports.length,
          vehicleTypes: vehicleTypes.length,
        }
      }
    })

  } catch (error) {
    console.error('Error fetching towing matrices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch towing matrices' },
      { status: 500 }
    )
  }
}

// POST: Create a new towing route
const CreateRouteSchema = z.object({
  auctionLocationId: z.string(),
  deliveryPortId: z.string(),
  basePrice: z.number().min(0),
  vehiclePrices: z.record(z.number().min(0)).optional(),
  active: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateRouteSchema.parse(body)

    // Check if route already exists
    const existingRoute = getTowingRoute(validatedData.auctionLocationId, validatedData.deliveryPortId)
    if (existingRoute) {
      return NextResponse.json(
        { success: false, error: 'Towing route already exists for this auction location and port combination' },
        { status: 409 }
      )
    }

    // Generate fixed vehicle prices if not provided (no multipliers)
    let vehiclePrices = validatedData.vehiclePrices || {}
    if (!validatedData.vehiclePrices || Object.keys(validatedData.vehiclePrices).length === 0) {
      // Create default fixed prices based on base price with reasonable adjustments for each vehicle type
      const basePrice = validatedData.basePrice
      vehiclePrices = {
        'vt-sedan': basePrice,
        'vt-coupe': basePrice,
        'vt-hatchback': basePrice,
        'vt-convertible': basePrice + 10,
        'vt-wagon': basePrice + 10,
        'vt-suv': Math.round(basePrice * 1.2),
        'vt-pickup': Math.round(basePrice * 1.15),
        'vt-truck': Math.round(basePrice * 1.25),
        'vt-bigsuv': Math.round(basePrice * 1.5),
        'vt-van': Math.round(basePrice * 1.3),
        'vt-motorcycle': Math.round(basePrice * 0.7),
        'vt-atv': Math.round(basePrice * 0.8),
        'vt-boat': Math.round(basePrice * 2),
        'vt-rv': Math.round(basePrice * 2.5),
      }
    }

    // Create the new route
    const newRoute = createTowingRoute({
      auctionLocationId: validatedData.auctionLocationId,
      deliveryPortId: validatedData.deliveryPortId,
      basePrice: validatedData.basePrice,
      vehiclePrices,
      active: validatedData.active,
    })

    // Enhance with location and port details for response
    const location = getLocationById(newRoute.auctionLocationId)
    const port = getPortById(newRoute.deliveryPortId)

    return NextResponse.json({
      success: true,
      data: {
        ...newRoute,
        auctionLocation: location,
        deliveryPort: port,
      }
    })

  } catch (error) {
    console.error('Error creating towing route:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create towing route' },
      { status: 500 }
    )
  }
}