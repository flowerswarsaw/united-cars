import { z } from 'zod'

// Input schema
export const TowingInputSchema = z.object({
  auctionLocationId: z.string(),
  shipperId: z.string(),
  deliveryPortId: z.string(),
  vehicleType: z.enum(['SEDAN', 'SUV', 'BIGSUV', 'VAN', 'PICKUP']).optional()
})

// Output schema
export const TowingOutputSchema = z.object({
  deliveryPort: z.string(),
  priceUSD: z.number(),
  rationale: z.string(),
  version: z.string()
})

export type TowingInput = z.infer<typeof TowingInputSchema>
export type TowingOutput = z.infer<typeof TowingOutputSchema>

// Towing rule types
export interface TowingRule {
  id: string
  shipperId: string
  auctionLocationId: string
  deliveryPortId: string
  ruleType: 'flat' | 'multiplier' | 'category'
  basePrice: number
  perTypeData?: Record<string, number>
}

export interface VehicleTypeData {
  key: string
  multiplier: number
  category: string
}

/**
 * Calculate towing cost based on route and vehicle type
 */
export function calculateTowing(
  input: TowingInput,
  towingRules: TowingRule[],
  vehicleTypes: VehicleTypeData[]
): TowingOutput {
  // Validate input
  const validInput = TowingInputSchema.parse(input)
  
  // Find matching towing rule
  const rule = towingRules.find(r => 
    r.shipperId === validInput.shipperId &&
    r.auctionLocationId === validInput.auctionLocationId &&
    r.deliveryPortId === validInput.deliveryPortId
  )

  if (!rule) {
    throw new Error(`No towing rule found for route ${validInput.auctionLocationId} -> ${validInput.deliveryPortId} via ${validInput.shipperId}`)
  }

  let priceUSD = rule.basePrice
  let rationale = `Base price: $${rule.basePrice}`

  // Apply pricing logic based on rule type
  if (rule.ruleType === 'flat') {
    // Price is already set
    rationale += ' (flat rate)'
  } 
  else if (rule.ruleType === 'multiplier' && validInput.vehicleType) {
    const vehicleTypeData = vehicleTypes.find(vt => vt.key === validInput.vehicleType)
    if (vehicleTypeData) {
      priceUSD = rule.basePrice * vehicleTypeData.multiplier
      rationale += ` × ${vehicleTypeData.multiplier} (${validInput.vehicleType} multiplier) = $${priceUSD}`
    }
  }
  else if (rule.ruleType === 'category' && validInput.vehicleType && rule.perTypeData) {
    const vehicleTypeData = vehicleTypes.find(vt => vt.key === validInput.vehicleType)
    if (vehicleTypeData && rule.perTypeData[vehicleTypeData.category]) {
      priceUSD = rule.perTypeData[vehicleTypeData.category]
      rationale = `Category-based pricing: ${vehicleTypeData.category} = $${priceUSD}`
    }
  }

  return TowingOutputSchema.parse({
    deliveryPort: validInput.deliveryPortId,
    priceUSD: Math.round(priceUSD * 100) / 100,
    rationale,
    version: '1.0.0'
  })
}