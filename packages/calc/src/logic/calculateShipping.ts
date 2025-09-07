/**
 * Shipping Calculation Logic - Stubbed Version
 * 
 * Provides basic shipping calculations compatible with current type definitions
 */

import { VehicleType, ShippingResult } from '../types/pricing';

export interface ShippingCalculationParams {
  vehicleType: VehicleType;
  originPortId: string;
  destinationPortId: string;
  vehicleValue?: number;
  expedited?: boolean;
}

export function calculateShipping(params: ShippingCalculationParams): ShippingResult {
  // Base rates by vehicle type
  const baseRates: Record<VehicleType, number> = {
    [VehicleType.SEDAN]: 1200,
    [VehicleType.SUV]: 1400,
    [VehicleType.TRUCK]: 1600,
    [VehicleType.MOTORCYCLE]: 800,
    [VehicleType.VAN]: 1500,
    [VehicleType.COUPE]: 1250,
    [VehicleType.CONVERTIBLE]: 1300,
    [VehicleType.WAGON]: 1350
  };

  const baseRate = baseRates[params.vehicleType] || 1200;
  const fuelSurcharge = baseRate * 0.15; // 15% fuel surcharge
  const insuranceFee = Math.max(50, (params.vehicleValue || 10000) * 0.005); // 0.5% of value, min $50
  const handlingFee = 100;
  const volumeDiscount = params.expedited ? 0 : -baseRate * 0.05; // 5% discount if not expedited

  const total = baseRate + fuelSurcharge + insuranceFee + handlingFee + volumeDiscount;

  return {
    total,
    breakdown: {
      baseRate,
      volumeDiscount,
      fuelSurcharge,
      insuranceFee,
      handlingFee
    },
    containerType: 'RORO', // Roll-on/Roll-off
    estimatedTransitDays: 14
  };
}