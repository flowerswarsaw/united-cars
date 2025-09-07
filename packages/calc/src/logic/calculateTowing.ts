import { VehicleType, TowingRule, TowingResult } from '../types/pricing'

interface TowingParams {
  shipperId: string
  locationId: string
  vehicleTypeId: string
  towingRules: TowingRule[]
  vehicleTypes: VehicleType[]
  destinationPortId?: string
}

/**
 * Calculates towing price with advanced rule types and port matrix logic
 */
export function calculateTowingPrice({
  shipperId,
  locationId,
  vehicleTypeId,
  towingRules,
  vehicleTypes,
  destinationPortId
}: TowingParams): TowingResult {
  try {
    // Find the specific towing rule for this shipper and location
    const towingRule = towingRules.find(rule => 
      rule.shipperId === shipperId && 
      rule.locationId === locationId && 
      rule.active
    )

    if (!towingRule) {
      return {
        price: 0,
        errorCode: "TOWING_RULE_NOT_FOUND"
      }
    }

    // Find vehicle type for category and multiplier info
    const vehicleType = vehicleTypes.find(v => v.id === vehicleTypeId)
    if (!vehicleType) {
      return {
        price: 0,
        errorCode: "VEHICLE_TYPE_NOT_FOUND"
      }
    }

    // Handle different rule types
    switch (towingRule.ruleType) {
      case 'flat':
        return {
          price: towingRule.price as number,
          preferredPort: towingRule.preferredPort
        }

      case 'category':
        const categoryPrices = towingRule.price as { [category: string]: number }
        const categoryPrice = categoryPrices[vehicleType.category]
        
        if (!categoryPrice) {
          return {
            price: 0,
            errorCode: "CATEGORY_PRICE_NOT_FOUND"
          }
        }
        
        return {
          price: categoryPrice,
          preferredPort: towingRule.preferredPort
        }

      case 'multiplier':
        const basePrice = towingRule.basePrice || 0
        const multiplierPrice = Math.round(basePrice * vehicleType.multiplier)
        
        return {
          price: multiplierPrice,
          preferredPort: towingRule.preferredPort
        }

      case 'port-matrix':
        // Use port matrix pricing - most sophisticated option
        if (!destinationPortId || !towingRule.destinationPorts) {
          return {
            price: 0,
            errorCode: "PORT_MATRIX_MISSING_DATA"
          }
        }

        const portPrice = towingRule.destinationPorts[destinationPortId]
        if (!portPrice) {
          return {
            price: 0,
            errorCode: "DESTINATION_PORT_NOT_FOUND"
          }
        }

        // Apply vehicle type multiplier to port matrix price
        const finalPrice = Math.round(portPrice * vehicleType.multiplier)
        
        return {
          price: finalPrice,
          preferredPort: towingRule.preferredPort
        }

      default:
        return {
          price: 0,
          errorCode: "INVALID_RULE_TYPE"
        }
    }
  } catch (error) {
    console.error("Error calculating towing price:", error)
    return {
      price: 0,
      errorCode: "CALCULATION_ERROR"
    }
  }
}