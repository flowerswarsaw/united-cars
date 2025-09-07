/**
 * Towing Calculation Logic - Stubbed Version
 * 
 * Provides basic towing calculations compatible with current type definitions
 */

import { VehicleType, TowingResult, AuctionLocation } from '../types/pricing';

export interface TowingCalculationParams {
  vehicleType: VehicleType;
  auctionLocationId: string;
  destinationPortId: string;
  distance?: number;
}

export function calculateTowing(params: TowingCalculationParams): TowingResult {
  // Base fees by vehicle type
  const baseFees: Record<VehicleType, number> = {
    [VehicleType.SEDAN]: 300,
    [VehicleType.SUV]: 350,
    [VehicleType.TRUCK]: 400,
    [VehicleType.MOTORCYCLE]: 200,
    [VehicleType.VAN]: 375,
    [VehicleType.COUPE]: 325,
    [VehicleType.CONVERTIBLE]: 350,
    [VehicleType.WAGON]: 340
  };

  const distance = params.distance || 150; // Default 150 miles
  const baseFee = baseFees[params.vehicleType] || 300;
  const mileageFee = distance * 2.5; // $2.50 per mile
  const vehicleTypeSurcharge = baseFee * 0.1; // 10% surcharge
  const fuelSurcharge = (baseFee + mileageFee) * 0.12; // 12% fuel surcharge

  const total = baseFee + mileageFee + vehicleTypeSurcharge + fuelSurcharge;

  return {
    total,
    breakdown: {
      baseFee,
      mileageFee,
      vehicleTypeSurcharge,
      fuelSurcharge
    },
    distance,
    estimatedTime: `${Math.ceil(distance / 55)} hours` // Assuming 55 mph average
  };
}