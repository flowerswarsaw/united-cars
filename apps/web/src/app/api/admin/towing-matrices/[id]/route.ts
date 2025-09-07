import { NextRequest, NextResponse } from 'next/server'
import { 
  towingRoutes,
  updateTowingRoute,
  deleteTowingRoute,
  getLocationById,
  getPortById,
  vehicleTypes
} from '@united-cars/mock-data'
import { z } from 'zod'

// GET: Fetch a specific towing route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const route = towingRoutes.find(r => r.id === id)
    
    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Towing route not found' },
        { status: 404 }
      )
    }

    // Enhance with location and port details
    const location = getLocationById(route.auctionLocationId)
    const port = getPortById(route.deliveryPortId)

    return NextResponse.json({
      success: true,
      data: {
        ...route,
        auctionLocation: location,
        deliveryPort: port,
      }
    })

  } catch (error) {
    console.error('Error fetching towing route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch towing route' },
      { status: 500 }
    )
  }
}

// PUT: Update a towing route
const UpdateRouteSchema = z.object({
  basePrice: z.number().min(0).optional(), // Reference only, auto-calculated from sedan+suv average
  vehiclePrices: z.record(z.number().min(0)).optional(),
  active: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const validatedData = UpdateRouteSchema.parse(body)

    const route = towingRoutes.find(r => r.id === id)
    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Towing route not found' },
        { status: 404 }
      )
    }

    // Auto-calculate base price if vehicle prices are provided
    if (validatedData.vehiclePrices) {
      const sedanPrice = validatedData.vehiclePrices['vt-sedan'] || route.vehiclePrices['vt-sedan'] || 0
      const suvPrice = validatedData.vehiclePrices['vt-suv'] || route.vehiclePrices['vt-suv'] || 0
      validatedData.basePrice = Math.round((sedanPrice + suvPrice) / 2)
    }

    const updatedRoute = updateTowingRoute(id, validatedData)
    
    if (!updatedRoute) {
      return NextResponse.json(
        { success: false, error: 'Failed to update route' },
        { status: 500 }
      )
    }

    // Enhance with location and port details
    const location = getLocationById(updatedRoute.auctionLocationId)
    const port = getPortById(updatedRoute.deliveryPortId)

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRoute,
        auctionLocation: location,
        deliveryPort: port,
      }
    })

  } catch (error) {
    console.error('Error updating towing route:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update towing route' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a towing route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTowingRoute(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Towing route not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Towing route deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting towing route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete towing route' },
      { status: 500 }
    )
  }
}