// Enhanced pricing types based on real calculator data
export interface VehicleType {
  id: string
  label: string
  category: 'regular' | 'oversize'
  multiplier: number
}

export interface AuctionLocation {
  id: string
  auctionHouse: 'copart' | 'iaa' | 'manheim'
  state: string
  city: string
  locationName: string
  active: boolean
}

export interface Port {
  id: string
  label: string
  state?: string
  code: string
  active: boolean
}

export interface DestinationPort {
  id: string
  label: string
  country: string
  shippingCode: string
  active: boolean
}

// Towing pricing structures
export interface TowingRule {
  id: string
  shipperId: string
  locationId: string
  ruleType: 'flat' | 'category' | 'multiplier' | 'port-matrix'
  destinationPorts?: { [portId: string]: number }
  preferredPort?: string
  price?: number | { [category: string]: number }
  basePrice?: number
  active: boolean
}

export interface TowingResult {
  price: number
  errorCode?: string
  preferredPort?: string
}

// Shipping pricing structures
export interface ShippingRule {
  id: string
  shipperId: string
  fromPortId: string
  toPortId: string
  vehicleTypePrices: { [vehicleTypeId: string]: number }
  active: boolean
}

export interface ShippingResult {
  price: number
  errorCode?: string
}

// Shipper fee structures
export interface ShipperFee {
  id: string
  shipperId: string
  fees: {
    serviceFee: number
    hybridElectro: number
    titleChange: number
  }
  active: boolean
}

export interface FeeResult {
  price: number
  breakdown: {
    serviceFee: number
    hybridElectro: number
    titleChange: number
  }
  errorCode?: string
}

// Comprehensive calculation result
export interface CalculationResult {
  total: number
  breakdown: {
    towing: number
    shipping: number
    fees: number
    feesBreakdown?: {
      serviceFee: number
      hybridElectro: number
      titleChange: number
    }
  }
  errors: string[]
  metadata?: {
    preferredPort?: string
    vehicleCategory?: string
    shippingRoute?: string
  }
}

// Calculation input parameters
export interface CalculationInput {
  vehicleTypeId: string
  auctionLocationId: string
  shippingPortId: string
  destinationPortId: string
  shipperId: string
  isHybridElectric?: boolean
  needsTitleChange?: boolean
}