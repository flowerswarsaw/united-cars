import { 
  CalculationInput, 
  CalculationResult, 
  VehicleType, 
  TowingRule, 
  ShippingRule, 
  ShipperFee 
} from '../types/pricing'
import { calculateTowingPrice } from './calculateTowing'
import { calculateShippingPrice } from './calculateShipping'
import { calculateAdditionalFees } from './calculateFees'

interface TotalCalculationParams extends CalculationInput {
  vehicleTypes: VehicleType[]
  towingRules: TowingRule[]
  shippingRules: ShippingRule[]
  shipperFees: ShipperFee[]
}

/**
 * Calculates the total shipping cost with comprehensive breakdown
 */
export function calculateTotal({
  vehicleTypeId,
  auctionLocationId,
  shippingPortId,
  destinationPortId,
  shipperId,
  isHybridElectric = false,
  needsTitleChange = false,
  vehicleTypes,
  towingRules,
  shippingRules,
  shipperFees
}: TotalCalculationParams): CalculationResult {
  const errors: string[] = []

  // Validate all required fields
  if (!vehicleTypeId || !auctionLocationId || !shippingPortId || !destinationPortId || !shipperId) {
    errors.push("MISSING_REQUIRED_FIELDS")
    return {
      total: 0,
      breakdown: {
        towing: 0,
        shipping: 0,
        fees: 0
      },
      errors
    }
  }

  // Validate required data arrays
  if (!vehicleTypes.length || !towingRules.length || !shippingRules.length || !shipperFees.length) {
    errors.push("MISSING_DATA_ARRAYS")
    return {
      total: 0,
      breakdown: {
        towing: 0,
        shipping: 0,
        fees: 0
      },
      errors
    }
  }

  // Get vehicle type for metadata
  const vehicleType = vehicleTypes.find(v => v.id === vehicleTypeId)

  // Calculate towing price (auction location to port)
  const towingResult = calculateTowingPrice({
    shipperId,
    locationId: auctionLocationId,
    vehicleTypeId,
    towingRules,
    vehicleTypes,
    destinationPortId: shippingPortId // Towing goes to shipping port
  })

  if (towingResult.errorCode) {
    errors.push(towingResult.errorCode)
  }

  // Calculate shipping price (port to destination)
  const shippingResult = calculateShippingPrice({
    shipperId,
    shippingPortId,
    destinationPortId,
    vehicleTypeId,
    shippingRules
  })

  if (shippingResult.errorCode) {
    errors.push(shippingResult.errorCode)
  }

  // Calculate additional fees
  const feesResult = calculateAdditionalFees({
    shipperId,
    vehicleTypeId,
    isHybridElectric,
    needsTitleChange,
    shipperFees
  })

  if (feesResult.errorCode) {
    errors.push(feesResult.errorCode)
  }

  // Calculate total
  const total = towingResult.price + shippingResult.price + feesResult.price

  // Build shipping route string for metadata
  const shippingRoute = `${shippingPortId} → ${destinationPortId}`

  return {
    total,
    breakdown: {
      towing: towingResult.price,
      shipping: shippingResult.price,
      fees: feesResult.price,
      feesBreakdown: feesResult.breakdown
    },
    errors,
    metadata: {
      preferredPort: towingResult.preferredPort,
      vehicleCategory: vehicleType?.category,
      shippingRoute
    }
  }
}