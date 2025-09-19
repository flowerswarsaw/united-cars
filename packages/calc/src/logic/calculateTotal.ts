/**
 * Total Calculation Logic - Stubbed Version
 * 
 * Provides comprehensive calculation using stubbed components
 */

import { VehicleType, CalculationResult, TowingResult, ShippingResult, FeeResult } from '../types/pricing';
import { calculateTowing } from './calculateTowing';
import { calculateShipping } from './calculateShipping';
import { calculateFees } from './calculateFees';

export interface TotalCalculationParams {
  vehicleType: VehicleType;
  auctionLocationId: string;
  shippingPortId: string;
  destinationPortId: string;
  shipperId: string;
  vehicleValue?: number;
  expedited?: boolean;
  storageDays?: number;
  isHybridElectric?: boolean;
  needsTitleChange?: boolean;
}

export function calculateTotal(params: TotalCalculationParams): CalculationResult {
  // Calculate individual components
  const towing = calculateTowing({
    vehicleType: params.vehicleType,
    auctionLocationId: params.auctionLocationId,
    destinationPortId: params.shippingPortId
  });

  const shipping = calculateShipping({
    vehicleType: params.vehicleType,
    originPortId: params.shippingPortId,
    destinationPortId: params.destinationPortId,
    vehicleValue: params.vehicleValue,
    expedited: params.expedited
  });

  const fees = calculateFees({
    shipperId: params.shipperId,
    vehicleValue: params.vehicleValue,
    expedited: params.expedited,
    storageDays: params.storageDays,
    isHybridElectric: params.isHybridElectric,
    needsTitleChange: params.needsTitleChange
  });

  // Calculate totals
  const towingTotal = towing.total;
  const shippingTotal = shipping.total;
  const feesTotal = fees.reduce((sum: number, fee: FeeResult) => sum + fee.amount, 0);
  
  const subtotal = towingTotal + shippingTotal + feesTotal;
  const taxes = subtotal * 0.08; // 8% tax
  const total = subtotal + taxes;

  // Estimate delivery date (14 days + transit time)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 14 + shipping.estimatedTransitDays);

  return {
    total,
    currency: 'USD' as const,
    towing,
    shipping,
    fees,
    shipper: {
      shipperId: params.shipperId,
      shipperName: 'Default Shipper',
      fees: {
        documentationFee: 150,
        inspectionFee: 75,
        storageFeePerDay: 25,
        expediteFee: params.expedited ? 200 : undefined
      }
    },
    estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
    breakdown: {
      subtotal,
      taxes,
      total
    }
  };
}