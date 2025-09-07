/**
 * Pricing Types for United Cars Calculation Engine
 */

// Vehicle type enumeration
export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  TRUCK = 'truck',
  MOTORCYCLE = 'motorcycle',
  VAN = 'van',
  COUPE = 'coupe',
  CONVERTIBLE = 'convertible',
  WAGON = 'wagon'
}

// Auction location interface
export interface AuctionLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  zipCode: string;
  active: boolean;
}

// Port interface for shipping
export interface Port {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  code: string;
  type: 'origin' | 'destination';
  active: boolean;
}

// Destination port specific interface
export interface DestinationPort extends Port {
  type: 'destination';
  containerTypes: string[];
  estimatedTransitDays: number;
}

// Towing calculation result
export interface TowingResult {
  total: number;
  breakdown: {
    baseFee: number;
    mileageFee: number;
    vehicleTypeSurcharge: number;
    fuelSurcharge: number;
  };
  distance: number;
  estimatedTime: string;
}

// Shipping calculation result
export interface ShippingResult {
  total: number;
  breakdown: {
    baseRate: number;
    volumeDiscount: number;
    fuelSurcharge: number;
    insuranceFee: number;
    handlingFee: number;
  };
  containerType: string;
  estimatedTransitDays: number;
}

// Shipper fee structure
export interface ShipperFee {
  shipperId: string;
  shipperName: string;
  fees: {
    documentationFee: number;
    inspectionFee: number;
    storageFeePerDay: number;
    expediteFee?: number;
  };
}

// Generic fee calculation result
export interface FeeResult {
  type: string;
  description: string;
  amount: number;
  required: boolean;
}

// Overall calculation result
export interface CalculationResult {
  total: number;
  currency: 'USD';
  towing: TowingResult;
  shipping: ShippingResult;
  fees: FeeResult[];
  shipper: ShipperFee;
  estimatedDelivery: string;
  breakdown: {
    subtotal: number;
    taxes: number;
    total: number;
  };
}

// Input interface for calculations
export interface CalculationInput {
  vehicleTypeId: string;
  auctionLocationId: string;
  shippingPortId: string;
  destinationPortId: string;
  shipperId: string;
  vehicleValue?: number;
  expedited?: boolean;
  insurance?: boolean;
}

// Vehicle type pricing matrix
export interface VehicleTypePricing {
  [VehicleType.SEDAN]: number;
  [VehicleType.SUV]: number;
  [VehicleType.TRUCK]: number;
  [VehicleType.MOTORCYCLE]: number;
  [VehicleType.VAN]: number;
  [VehicleType.COUPE]: number;
  [VehicleType.CONVERTIBLE]: number;
  [VehicleType.WAGON]: number;
}

// Consolidated pricing structure
export interface ConsolidationPricing {
  quarter: number;  // 1/4 container
  third: number;    // 1/3 container
  half: number;     // 1/2 container
  full: number;     // Full container
}

// Route pricing matrix
export interface RoutePricing {
  portId: string;
  portName: string;
  vehicleTypes: VehicleTypePricing;
  consolidation: ConsolidationPricing;
  active: boolean;
}
