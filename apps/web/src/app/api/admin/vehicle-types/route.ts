import { NextRequest, NextResponse } from 'next/server'
import { vehicleTypes } from '@united-cars/mock-data'

// GET: Fetch all vehicle types
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let filteredVehicleTypes = [...vehicleTypes]

    // Filter by category
    if (category) {
      filteredVehicleTypes = filteredVehicleTypes.filter(vt => vt.category === category)
    }

    // Group by category for easier consumption
    const groupedByCategory = filteredVehicleTypes.reduce((acc, vt) => {
      if (!acc[vt.category]) {
        acc[vt.category] = []
      }
      acc[vt.category].push(vt)
      return acc
    }, {} as Record<string, typeof filteredVehicleTypes>)

    // Calculate category stats
    const categoryStats = Object.entries(groupedByCategory).map(([category, types]) => ({
      category,
      count: types.length,
      avgMultiplier: types.reduce((sum, t) => sum + t.multiplier, 0) / types.length,
      minMultiplier: Math.min(...types.map(t => t.multiplier)),
      maxMultiplier: Math.max(...types.map(t => t.multiplier)),
    }))

    return NextResponse.json({
      success: true,
      data: {
        vehicleTypes: filteredVehicleTypes,
        groupedByCategory,
        categoryStats,
        totalCount: filteredVehicleTypes.length,
      }
    })

  } catch (error) {
    console.error('Error fetching vehicle types:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle types' },
      { status: 500 }
    )
  }
}