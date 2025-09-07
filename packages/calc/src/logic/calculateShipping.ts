import { ShippingRule, ShippingResult } from '../types/pricing'

interface ShippingParams {
  shipperId: string
  shippingPortId: string
  destinationPortId: string
  vehicleTypeId: string
  shippingRules: ShippingRule[]
}

/**
 * Calculates shipping price based on shipper, ports and vehicle type
 */
export function calculateShippingPrice({
  shipperId,
  shippingPortId,
  destinationPortId,
  vehicleTypeId,
  shippingRules
}: ShippingParams): ShippingResult {
  try {
    // Validate inputs
    if (!shipperId || !shippingPortId || !destinationPortId || !vehicleTypeId) {
      return { 
        price: 0, 
        errorCode: "SHIPPING_MISSING_REQUIRED_FIELDS" 
      }
    }

    // Find the shipping rule for this specific route and shipper
    const shippingRule = shippingRules.find(rule => 
      rule.shipperId === shipperId &&
      rule.fromPortId === shippingPortId &&
      rule.toPortId === destinationPortId &&
      rule.active
    )

    if (!shippingRule) {
      return { 
        price: 0, 
        errorCode: "SHIPPING_ROUTE_NOT_FOUND" 
      }
    }

    // Check if vehicle type has a price for this route
    const vehiclePrice = shippingRule.vehicleTypePrices[vehicleTypeId]
    
    if (!vehiclePrice) {
      return { 
        price: 0, 
        errorCode: "VEHICLE_TYPE_PRICE_NOT_FOUND" 
      }
    }

    return { 
      price: vehiclePrice 
    }

  } catch (error) {
    console.error("Error calculating shipping price:", error)
    return { 
      price: 0, 
      errorCode: "SHIPPING_CALCULATION_ERROR" 
    }
  }
}