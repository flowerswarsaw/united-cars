import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  towingRoutes,
  auctionLocations,
  ports,
  vehicleTypes,
  getLocationById,
  getPortById,
  getVehicleTypeById,
  getTowingRoute
} from '@united-cars/mock-data'

// Input validation schema
const TowingInputSchema = z.object({
  auctionLocationId: z.string().min(1, 'Auction location is required'),
  deliveryPortId: z.string().min(1, 'Delivery port is required'),
  vehicleTypeId: z.string().min(1, 'Vehicle type is required'),
})

// New calculation function using mock data
function calculateTowingCost(input: any) {
  const { auctionLocationId, deliveryPortId, vehicleTypeId } = input

  // Find the towing route
  const route = getTowingRoute(auctionLocationId, deliveryPortId)
  
  if (!route || !route.active) {
    // Check if auction location has preferred port and try that
    const auctionLocation = getLocationById(auctionLocationId)
    if (auctionLocation?.preferredPortId) {
      const preferredRoute = getTowingRoute(auctionLocationId, auctionLocation.preferredPortId)
      if (preferredRoute && preferredRoute.active) {
        return calculateWithRoute(preferredRoute, vehicleTypeId, auctionLocation.preferredPortId, input)
      }
    }
    
    throw new Error('No active towing route found for this auction location and port combination')
  }

  return calculateWithRoute(route, vehicleTypeId, deliveryPortId, input)
}

function calculateWithRoute(route: any, vehicleTypeId: string, actualPortId: string, input: any) {
  const auctionLocation = getLocationById(route.auctionLocationId)
  const deliveryPort = getPortById(actualPortId)
  const vehicleType = getVehicleTypeById(vehicleTypeId)

  if (!auctionLocation || !deliveryPort || !vehicleType) {
    throw new Error('Invalid location, port, or vehicle type')
  }

  // Get fixed vehicle-specific price (no multipliers used)
  const vehiclePrice = route.vehiclePrices[vehicleTypeId]
  
  if (!vehiclePrice) {
    throw new Error(`No pricing found for ${vehicleType.name} on this route`)
  }

  return {
    towingCost: vehiclePrice,
    breakdown: {
      vehicleType: vehicleType.name,
      fixedPrice: vehiclePrice,
      priceType: 'fixed', // No multiplier calculation
      route: {
        from: `${auctionLocation.auction} ${auctionLocation.name}, ${auctionLocation.state}`,
        to: `${deliveryPort.name}, ${deliveryPort.state} (${deliveryPort.code})`,
        isPreferredPort: auctionLocation.preferredPortId === actualPortId
      }
    },
    metadata: {
      calculatedAt: new Date().toISOString(),
      routeId: route.id,
      auctionLocationId: route.auctionLocationId,
      deliveryPortId: actualPortId,
      vehicleTypeId,
      pricing: {
        model: 'fixed_per_vehicle_type',
        allVehiclePrices: Object.keys(route.vehiclePrices).reduce((acc: any, vtId) => {
          const vt = getVehicleTypeById(vtId)
          if (vt) {
            acc[vt.name] = route.vehiclePrices[vtId]
          }
          return acc
        }, {})
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input = TowingInputSchema.parse(body)

    // Calculate towing cost using new mock data system
    const result = calculateTowingCost(input)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Towing calculation error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid input parameters', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Calculation failed' },
      { status: 500 }
    )
  }
}