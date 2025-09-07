// Export all calculator modules
export * from './auction'
export * from './towing'
export * from './shipping'
export * from './customs'

// Enhanced calculation engine based on real auction calculator data
export {
  VehicleType,
  AuctionLocation,
  Port,
  DestinationPort,
  TowingResult,
  ShippingResult,
  ShipperFee,
  FeeResult,
  CalculationResult,
  CalculationInput
} from './types/pricing'
export * from './logic/calculateTowing'
export * from './logic/calculateShipping'
export * from './logic/calculateFees'
export * from './logic/calculateTotal'

// Data matrices
export * from './data/towingMatrices'
export * from './data/shippingMatrices'
export * from './data/auctionMatrices'
export * from './data/auctionLocations'

// Main calculation function for easy use
export { calculateTotal as calculateShippingTotal } from './logic/calculateTotal'

// Data validation functions
export function validateCalculationInput(input: any): string[] {
  const errors: string[] = []
  
  if (!input.vehicleTypeId) errors.push("Vehicle type is required")
  if (!input.auctionLocationId) errors.push("Auction location is required")
  if (!input.shippingPortId) errors.push("Shipping port is required")
  if (!input.destinationPortId) errors.push("Destination port is required")
  if (!input.shipperId) errors.push("Shipper is required")
  
  return errors
}

// Error code descriptions for user-friendly messages
export const ERROR_MESSAGES: { [key: string]: string } = {
  "MISSING_REQUIRED_FIELDS": "Please fill in all required fields",
  "MISSING_DATA_ARRAYS": "Pricing data is not loaded",
  "TOWING_RULE_NOT_FOUND": "Towing rates not available for this route",
  "VEHICLE_TYPE_NOT_FOUND": "Invalid vehicle type",
  "CATEGORY_PRICE_NOT_FOUND": "Pricing not available for this vehicle category",
  "PORT_MATRIX_MISSING_DATA": "Port routing data missing",
  "DESTINATION_PORT_NOT_FOUND": "Destination port not supported",
  "INVALID_RULE_TYPE": "Invalid pricing rule configuration",
  "CALCULATION_ERROR": "Calculation failed",
  "SHIPPING_MISSING_REQUIRED_FIELDS": "Shipping route information incomplete",
  "SHIPPING_ROUTE_NOT_FOUND": "Shipping route not available",
  "VEHICLE_TYPE_PRICE_NOT_FOUND": "Vehicle pricing not available for this route",
  "SHIPPING_CALCULATION_ERROR": "Shipping calculation failed",
  "SHIPPER_FEES_NOT_FOUND": "Fee structure not found for shipper",
  "FEE_CALCULATION_ERROR": "Fee calculation failed"
}