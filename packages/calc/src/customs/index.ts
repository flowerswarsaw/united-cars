import { z } from 'zod'

// Input schema
export const CustomsInputSchema = z.object({
  country: z.string(),
  cifValueUSD: z.number().min(0), // Cost, Insurance, Freight
  vehicleType: z.enum(['SEDAN', 'SUV', 'BIGSUV', 'VAN', 'PICKUP']).optional(),
  vehicleAge: z.number().optional(),
  engineSize: z.number().optional()
})

// Output schema
export const CustomsOutputSchema = z.object({
  cifValueUSD: z.number(),
  dutyUSD: z.number(),
  dutyRate: z.number(),
  vatUSD: z.number(),
  vatRate: z.number(),
  serviceFees: z.array(z.object({
    key: z.string(),
    amount: z.number(),
    description: z.string()
  })),
  totalCustomsUSD: z.number(),
  totalLandedCostUSD: z.number(),
  breakdown: z.object({
    cifValue: z.number(),
    duty: z.number(),
    serviceFeesTotal: z.number(),
    vatBase: z.number(),
    vat: z.number(),
    total: z.number()
  }),
  formulaVersion: z.string(),
  version: z.string()
})

export type CustomsInput = z.infer<typeof CustomsInputSchema>
export type CustomsOutput = z.infer<typeof CustomsOutputSchema>

// Customs rule types
export interface CustomsRule {
  id: string
  country: string
  vatPct: number
  dutyPctDefault: number
  serviceFees: Array<{
    key: string
    amount: number
    description: string
    condition?: string
  }>
  formulaVersion: string
}

/**
 * Calculate customs duties, VAT, and service fees
 * Formula: Duty = CIF × duty%, VAT = (CIF + Duty + ServiceFees) × vat%
 */
export function calculateCustoms(
  input: CustomsInput,
  customsRules: CustomsRule[]
): CustomsOutput {
  // Validate input
  const validInput = CustomsInputSchema.parse(input)
  
  // Find matching customs rule
  const rule = customsRules.find(r => r.country === validInput.country)

  if (!rule) {
    throw new Error(`No customs rule found for country ${validInput.country}`)
  }

  const cifValueUSD = validInput.cifValueUSD
  
  // Calculate duty
  let dutyRate = rule.dutyPctDefault / 100
  
  // Adjust duty rate based on vehicle characteristics
  if (validInput.vehicleAge && validInput.vehicleAge > 10) {
    dutyRate *= 1.2 // 20% increase for older vehicles
  }
  
  if (validInput.engineSize && validInput.engineSize > 3.0) {
    dutyRate += 0.05 // Additional 5% for large engines
  }

  const dutyUSD = cifValueUSD * dutyRate

  // Calculate service fees
  const serviceFees: Array<{ key: string; amount: number; description: string }> = []
  
  for (const fee of rule.serviceFees) {
    let shouldApply = true
    
    // Apply conditional logic
    if (fee.condition === 'high_value' && cifValueUSD < 25000) {
      shouldApply = false
    } else if (fee.condition === 'luxury' && (!validInput.vehicleType || !['SUV', 'BIGSUV'].includes(validInput.vehicleType))) {
      shouldApply = false
    }

    if (shouldApply) {
      serviceFees.push({
        key: fee.key,
        amount: fee.amount,
        description: fee.description
      })
    }
  }

  const serviceFeesTotal = serviceFees.reduce((sum, fee) => sum + fee.amount, 0)

  // Calculate VAT base and VAT
  const vatBase = cifValueUSD + dutyUSD + serviceFeesTotal
  const vatRate = rule.vatPct / 100
  const vatUSD = vatBase * vatRate

  // Calculate totals
  const totalCustomsUSD = dutyUSD + vatUSD + serviceFeesTotal
  const totalLandedCostUSD = cifValueUSD + totalCustomsUSD

  const breakdown = {
    cifValue: Math.round(cifValueUSD * 100) / 100,
    duty: Math.round(dutyUSD * 100) / 100,
    serviceFeesTotal: Math.round(serviceFeesTotal * 100) / 100,
    vatBase: Math.round(vatBase * 100) / 100,
    vat: Math.round(vatUSD * 100) / 100,
    total: Math.round(totalLandedCostUSD * 100) / 100
  }

  return CustomsOutputSchema.parse({
    cifValueUSD: Math.round(cifValueUSD * 100) / 100,
    dutyUSD: Math.round(dutyUSD * 100) / 100,
    dutyRate: Math.round(dutyRate * 10000) / 100, // Convert to percentage
    vatUSD: Math.round(vatUSD * 100) / 100,
    vatRate: Math.round(vatRate * 10000) / 100, // Convert to percentage
    serviceFees,
    totalCustomsUSD: Math.round(totalCustomsUSD * 100) / 100,
    totalLandedCostUSD: Math.round(totalLandedCostUSD * 100) / 100,
    breakdown,
    formulaVersion: rule.formulaVersion,
    version: '1.0.0'
  })
}