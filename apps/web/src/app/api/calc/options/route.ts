import { NextRequest, NextResponse } from 'next/server'
import { auctionLocations, ports, vehicleTypes } from '@united-cars/mock-data'

// GET: Fetch options for calculator dropdowns
export async function GET(request: NextRequest) {
  try {
    // Format data for calculator dropdowns
    const formattedLocations = auctionLocations.map(location => ({
      id: location.id,
      value: location.id,
      label: `${location.auction} - ${location.name}, ${location.state}`,
      auction: location.auction,
      state: location.state,
      preferredPortId: location.preferredPortId
    }))

    const formattedPorts = ports.map(port => ({
      id: port.id,
      value: port.id,
      label: `${port.name}, ${port.state} (${port.code})`,
      state: port.state,
      code: port.code
    }))

    const formattedVehicleTypes = vehicleTypes.map(vt => ({
      id: vt.id,
      value: vt.id,
      label: vt.name,
      key: vt.key,
      category: vt.category,
      multiplier: vt.multiplier
    }))

    // Group by auction house and state for easier filtering
    const locationsByAuction = formattedLocations.reduce((acc, location) => {
      if (!acc[location.auction]) {
        acc[location.auction] = []
      }
      acc[location.auction].push(location)
      return acc
    }, {} as Record<string, typeof formattedLocations>)

    const locationsByState = formattedLocations.reduce((acc, location) => {
      if (!acc[location.state]) {
        acc[location.state] = []
      }
      acc[location.state].push(location)
      return acc
    }, {} as Record<string, typeof formattedLocations>)

    const vehicleTypesByCategory = formattedVehicleTypes.reduce((acc, vt) => {
      if (!acc[vt.category]) {
        acc[vt.category] = []
      }
      acc[vt.category].push(vt)
      return acc
    }, {} as Record<string, typeof formattedVehicleTypes>)

    return NextResponse.json({
      success: true,
      data: {
        auctionLocations: formattedLocations,
        ports: formattedPorts,
        vehicleTypes: formattedVehicleTypes,
        
        // Grouped data
        locationsByAuction,
        locationsByState,
        vehicleTypesByCategory,
        
        // Summary stats
        stats: {
          totalLocations: formattedLocations.length,
          totalPorts: formattedPorts.length,
          totalVehicleTypes: formattedVehicleTypes.length,
          auctionHouses: Object.keys(locationsByAuction).length,
          states: Object.keys(locationsByState).length,
          vehicleCategories: Object.keys(vehicleTypesByCategory).length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching calculator options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calculator options' },
      { status: 500 }
    )
  }
}