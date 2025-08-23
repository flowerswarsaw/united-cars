import { z } from 'zod'

// Input schema
export const ShippingInputSchema = z.object({
  shipperId: z.string(),
  exitPortId: z.string(),
  destinationCountry: z.string(),
  destinationPort: z.string(),
  vehicleType: z.enum(['SEDAN', 'SUV', 'BIGSUV', 'VAN', 'PICKUP']).optional()
})

// Output schema
export const ShippingOutputSchema = z.object({
  oceanFreightUSD: z.number(),
  surcharges: z.array(z.object({
    key: z.string(),
    amount: z.number(),
    description: z.string()
  })),
  totalUSD: z.number(),
  version: z.string()
})

export type ShippingInput = z.infer<typeof ShippingInputSchema>
export type ShippingOutput = z.infer<typeof ShippingOutputSchema>

// Shipping rule types
export interface ShippingRule {
  id: string
  shipperId: string
  exitPortId: string
  destinationCountry: string
  destinationPort: string
  pricingData: {
    baseFreight: number
    currency: string
    surcharges?: Array<{
      key: string
      amount: number
      description: string
      condition?: string
    }>
  }
}

export interface GeneralFee {
  key: string
  value: number
  currency: string
  shipperId?: string
}

/**
 * Calculate shipping cost including ocean freight and surcharges
 */
export function calculateShipping(
  input: ShippingInput,
  shippingRules: ShippingRule[],
  generalFees: GeneralFee[]
): ShippingOutput {
  // Validate input
  const validInput = ShippingInputSchema.parse(input)
  
  // Find matching shipping rule
  const rule = shippingRules.find(r => 
    r.shipperId === validInput.shipperId &&
    r.exitPortId === validInput.exitPortId &&
    r.destinationCountry === validInput.destinationCountry &&
    r.destinationPort === validInput.destinationPort
  )

  if (!rule) {
    throw new Error(`No shipping rule found for route ${validInput.exitPortId} -> ${validInput.destinationCountry}/${validInput.destinationPort} via ${validInput.shipperId}`)
  }

  const oceanFreightUSD = rule.pricingData.baseFreight
  const surcharges: Array<{ key: string; amount: number; description: string }> = []

  // Add rule-specific surcharges
  if (rule.pricingData.surcharges) {
    for (const surcharge of rule.pricingData.surcharges) {
      // Apply condition logic if needed
      let shouldApply = true
      
      if (surcharge.condition === 'oversize' && validInput.vehicleType === 'BIGSUV') {
        shouldApply = true
      } else if (surcharge.condition && surcharge.condition !== 'always') {
        shouldApply = false
      }

      if (shouldApply) {
        surcharges.push({
          key: surcharge.key,
          amount: surcharge.amount,
          description: surcharge.description
        })
      }
    }
  }

  // Add general fees applicable to this shipper
  const applicableFees = generalFees.filter(fee => 
    !fee.shipperId || fee.shipperId === validInput.shipperId
  )

  for (const fee of applicableFees) {
    // Add common shipping fees
    if (['fuel_surcharge', 'port_handling', 'documentation'].includes(fee.key)) {
      surcharges.push({
        key: fee.key,
        amount: fee.value,
        description: `${fee.key.replace('_', ' ')} fee`
      })
    }
  }

  // Add vehicle type specific charges
  if (validInput.vehicleType === 'BIGSUV') {
    surcharges.push({
      key: 'oversize_surcharge',
      amount: 200,
      description: 'Oversize vehicle surcharge'
    })
  }

  const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0)
  const totalUSD = oceanFreightUSD + totalSurcharges

  return ShippingOutputSchema.parse({
    oceanFreightUSD: Math.round(oceanFreightUSD * 100) / 100,
    surcharges,
    totalUSD: Math.round(totalUSD * 100) / 100,
    version: '1.0.0'
  })
}