import { z } from 'zod'

// Input schema
export const AuctionFeeInputSchema = z.object({
  auction: z.enum(['COPART', 'IAA']),
  carPriceUSD: z.number().min(0),
  accountType: z.enum(['C', 'A']),
  titleType: z.enum(['clean', 'nonclean']),
  payment: z.enum(['secured', 'unsecured'])
})

// Output schema
export const AuctionFeeOutputSchema = z.object({
  breakdown: z.array(z.object({
    key: z.string(),
    amount: z.number()
  })),
  totalFeesUSD: z.number(),
  outTheDoorUSD: z.number(),
  version: z.string()
})

export type AuctionFeeInput = z.infer<typeof AuctionFeeInputSchema>
export type AuctionFeeOutput = z.infer<typeof AuctionFeeOutputSchema>

// Fee matrix type
export interface FeeBracket {
  min: number
  max: number | null
  fee: number
}

export interface FeeMatrix {
  auction: string
  accountType: string
  title: string
  payment: string
  brackets: FeeBracket[]
}

/**
 * Calculate auction fees based on input parameters and fee matrix
 */
export function calculateAuctionFees(
  input: AuctionFeeInput,
  matrices: FeeMatrix[]
): AuctionFeeOutput {
  // Validate input
  const validInput = AuctionFeeInputSchema.parse(input)
  
  // Find matching fee matrix
  const matrix = matrices.find(m => 
    m.auction === validInput.auction &&
    m.accountType === validInput.accountType &&
    m.title === validInput.titleType &&
    m.payment === validInput.payment
  )

  if (!matrix) {
    throw new Error(`No fee matrix found for ${validInput.auction} ${validInput.accountType} ${validInput.titleType} ${validInput.payment}`)
  }

  // Find applicable bracket
  const bracket = matrix.brackets.find(b => 
    validInput.carPriceUSD >= b.min && 
    (b.max === null || validInput.carPriceUSD <= b.max)
  )

  if (!bracket) {
    throw new Error(`No fee bracket found for price ${validInput.carPriceUSD}`)
  }

  const auctionFee = bracket.fee
  const documentationFee = validInput.auction === 'COPART' ? 59 : 65
  const gateFee = 89
  const internetBidFee = validInput.carPriceUSD * 0.005 // 0.5%
  
  // Additional fees based on conditions
  const additionalFees: Array<{ key: string; amount: number }> = []
  
  if (validInput.titleType === 'nonclean') {
    additionalFees.push({ key: 'title_processing', amount: 75 })
  }
  
  if (validInput.payment === 'unsecured') {
    additionalFees.push({ key: 'payment_processing', amount: validInput.carPriceUSD * 0.02 })
  }

  const breakdown = [
    { key: 'auction_fee', amount: auctionFee },
    { key: 'documentation_fee', amount: documentationFee },
    { key: 'gate_fee', amount: gateFee },
    { key: 'internet_bid_fee', amount: Math.round(internetBidFee * 100) / 100 },
    ...additionalFees
  ]

  const totalFeesUSD = breakdown.reduce((sum, item) => sum + item.amount, 0)
  const outTheDoorUSD = validInput.carPriceUSD + totalFeesUSD

  return AuctionFeeOutputSchema.parse({
    breakdown,
    totalFeesUSD: Math.round(totalFeesUSD * 100) / 100,
    outTheDoorUSD: Math.round(outTheDoorUSD * 100) / 100,
    version: '1.0.0'
  })
}