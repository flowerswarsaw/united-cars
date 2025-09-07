/**
 * Fee Calculation Logic - Stubbed Version
 * 
 * Provides basic fee calculations compatible with current type definitions
 */

import { ShipperFee, FeeResult } from '../types/pricing';

export interface FeeCalculationParams {
  shipperId: string;
  vehicleValue?: number;
  expedited?: boolean;
  storageDays?: number;
  isHybridElectric?: boolean;
  needsTitleChange?: boolean;
}

export function calculateFees(params: FeeCalculationParams): FeeResult[] {
  const fees: FeeResult[] = [];

  // Documentation fee
  fees.push({
    type: 'documentation',
    description: 'Documentation Fee',
    amount: 150,
    required: true
  });

  // Inspection fee  
  fees.push({
    type: 'inspection',
    description: 'Vehicle Inspection Fee',
    amount: 75,
    required: true
  });

  // Storage fee (if applicable)
  if (params.storageDays && params.storageDays > 0) {
    fees.push({
      type: 'storage',
      description: `Storage Fee (${params.storageDays} days)`,
      amount: params.storageDays * 25,
      required: true
    });
  }

  // Expedite fee (if requested)
  if (params.expedited) {
    fees.push({
      type: 'expedite',
      description: 'Expedited Processing Fee',
      amount: 200,
      required: false
    });
  }

  // Hybrid/Electric fee (if applicable)
  if (params.isHybridElectric) {
    fees.push({
      type: 'hybrid',
      description: 'Hybrid/Electric Vehicle Fee',
      amount: 100,
      required: true
    });
  }

  // Title change fee (if applicable)
  if (params.needsTitleChange) {
    fees.push({
      type: 'title',
      description: 'Title Change Fee',
      amount: 50,
      required: true
    });
  }

  return fees;
}