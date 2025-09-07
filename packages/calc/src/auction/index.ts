import { z } from 'zod'

// Copart specific types (based on reference)
export type CopartAccountType = 'A' | 'C'
export type CopartTitleType = 'clean' | 'non_clean'
export type PaymentMethod = 'secured' | 'unsecured'
export type BidType = 'pre_bid' | 'live_bid'

// IAA specific types (based on reference)
export type IAABuyerType = 'standard' | 'class_a'
export type IAABidType = 'live' | 'proxy'

// Fee bracket interface
export interface FeeBracket {
  min: number
  max: number
  fee: number | string
}

// Copart fee entry structure (matches reference exactly)
export interface CopartFeeEntry {
  auction_fee: Record<PaymentMethod, FeeBracket[]>
  gate_fee: number
  virtual_bid_fee: Record<BidType, FeeBracket[]>
  title_fee: number
  env_fee: number
}

// Input schema
export const AuctionFeeInputSchema = z.object({
  auction: z.enum(['COPART', 'IAA']),
  carPriceUSD: z.number().min(0),
  // Copart specific fields
  accountType: z.enum(['C', 'A']).optional(),
  titleType: z.enum(['clean', 'non_clean', 'salvage']).optional(),
  payment: z.enum(['secured', 'unsecured']).optional(),
  bidType: z.enum(['pre_bid', 'live_bid']).optional().default('pre_bid'),
  // IAA specific fields
  buyerType: z.enum(['standard', 'class_a']).optional(),
  iaaBidType: z.enum(['live', 'proxy']).optional().default('proxy')
})

// Output schema (supports both Copart and IAA structure)
export const AuctionFeeOutputSchema = z.object({
  total: z.number(),
  breakdown: z.object({
    // Copart breakdown
    auctionFee: z.number().optional(),
    bidFee: z.number().optional(),
    gateFee: z.number().optional(),
    titleFee: z.number().optional(),
    envFee: z.number().optional(),
    // IAA breakdown
    buyFee: z.number().optional(),
    fixedFees: z.number().optional()
  }),
  version: z.string()
})

export type AuctionFeeInput = z.infer<typeof AuctionFeeInputSchema>
export type AuctionFeeOutput = z.infer<typeof AuctionFeeOutputSchema>

// Helper function to select fee entry (matches reference)
function selectFeeEntry(account: CopartAccountType, title: CopartTitleType, feeEntries: Record<string, CopartFeeEntry>): CopartFeeEntry {
  const key = `${account}_${title}`
  const entry = feeEntries[key]
  if (!entry) {
    throw new Error(`No fee entry found for ${account} ${title}`)
  }
  return entry
}

// Helper function to get fee from brackets (matches reference exactly)
function getFee(brackets: FeeBracket[], price: number): number {
  for (const bracket of brackets) {
    if (price >= bracket.min && price <= bracket.max) {
      return typeof bracket.fee === "string" 
        ? price * (parseFloat(bracket.fee) / 100) 
        : bracket.fee
    }
  }
  return 0
}

// IAA fee constants (from reference)
const IAA_FIXED_FEES = 95 + 15 + 20 // service + environmental + title

const IAABidFees: Record<IAABidType, FeeBracket[]> = {
  live: [
    { min: 0, max: 99.99, fee: 0 },
    { min: 100, max: 499.99, fee: 50 },
    { min: 500, max: 999.99, fee: 65 },
    { min: 1000, max: 1499.99, fee: 85 },
    { min: 1500, max: 1999.99, fee: 95 },
    { min: 2000, max: 3999.99, fee: 110 },
    { min: 4000, max: 5999.99, fee: 125 },
    { min: 6000, max: 7999.99, fee: 145 },
    { min: 8000, max: Infinity, fee: 160 }
  ],
  proxy: [
    { min: 0, max: 99.99, fee: 0 },
    { min: 100, max: 499.99, fee: 40 },
    { min: 500, max: 999.99, fee: 55 },
    { min: 1000, max: 1499.99, fee: 75 },
    { min: 1500, max: 1999.99, fee: 85 },
    { min: 2000, max: 3999.99, fee: 100 },
    { min: 4000, max: 5999.99, fee: 110 },
    { min: 6000, max: 7999.99, fee: 125 },
    { min: 8000, max: Infinity, fee: 140 }
  ]
}

const IAABuyerFees: Record<IAABuyerType, FeeBracket[]> = {
  standard: [
    { min: 0, max: 49.99, fee: 0 },
    { min: 50, max: 99.99, fee: 25 },
    { min: 100, max: 199.99, fee: 80 },
    { min: 200, max: 299.99, fee: 130 },
    { min: 300, max: 349.99, fee: 137.5 },
    { min: 350, max: 399.99, fee: 145 },
    { min: 400, max: 449.99, fee: 175 },
    { min: 450, max: 499.99, fee: 185 },
    { min: 500, max: 549.99, fee: 205 },
    { min: 550, max: 599.99, fee: 210 },
    { min: 600, max: 699.99, fee: 240 },
    { min: 700, max: 799.99, fee: 270 },
    { min: 800, max: 899.99, fee: 295 },
    { min: 900, max: 999.99, fee: 320 },
    { min: 1000, max: 1199.99, fee: 375 },
    { min: 1200, max: 1299.99, fee: 395 },
    { min: 1300, max: 1399.99, fee: 410 },
    { min: 1400, max: 1499.99, fee: 430 },
    { min: 1500, max: 1599.99, fee: 445 },
    { min: 1600, max: 1699.99, fee: 465 },
    { min: 1700, max: 1799.99, fee: 485 },
    { min: 1800, max: 1999.99, fee: 510 },
    { min: 2000, max: 2399.99, fee: 535 },
    { min: 2400, max: 2499.99, fee: 570 },
    { min: 2500, max: 2999.99, fee: 610 },
    { min: 3000, max: 3499.99, fee: 655 },
    { min: 3500, max: 3999.99, fee: 705 },
    { min: 4000, max: 4499.99, fee: 725 },
    { min: 4500, max: 4999.99, fee: 750 },
    { min: 5000, max: 5499.99, fee: 775 },
    { min: 5500, max: 5999.99, fee: 800 },
    { min: 6000, max: 6499.99, fee: 825 },
    { min: 6500, max: 6999.99, fee: 845 },
    { min: 7000, max: 7499.99, fee: 880 },
    { min: 7500, max: 7999.99, fee: 900 },
    { min: 8000, max: 8499.99, fee: 925 },
    { min: 8500, max: 9999.99, fee: 945 },
    { min: 10000, max: 14999.99, fee: 1000 },
    { min: 15000, max: Infinity, fee: '7.5%' }
  ],
  class_a: [
    { min: 0, max: 99.99, fee: 1 },
    { min: 100, max: 199.99, fee: 25 },
    { min: 200, max: 299.99, fee: 60 },
    { min: 300, max: 349.99, fee: 85 },
    { min: 350, max: 399.99, fee: 100 },
    { min: 400, max: 449.99, fee: 125 },
    { min: 450, max: 499.99, fee: 135 },
    { min: 500, max: 549.99, fee: 145 },
    { min: 550, max: 599.99, fee: 155 },
    { min: 600, max: 699.99, fee: 170 },
    { min: 700, max: 799.99, fee: 195 },
    { min: 800, max: 899.99, fee: 215 },
    { min: 900, max: 999.99, fee: 230 },
    { min: 1000, max: 1199.99, fee: 250 },
    { min: 1200, max: 1299.99, fee: 270 },
    { min: 1300, max: 1399.99, fee: 285 },
    { min: 1400, max: 1499.99, fee: 300 },
    { min: 1500, max: 1599.99, fee: 315 },
    { min: 1600, max: 1699.99, fee: 330 },
    { min: 1700, max: 1799.99, fee: 350 },
    { min: 1800, max: 1999.99, fee: 370 },
    { min: 2000, max: 2399.99, fee: 390 },
    { min: 2400, max: 2499.99, fee: 425 },
    { min: 2500, max: 2999.99, fee: 460 },
    { min: 3000, max: 3499.99, fee: 505 },
    { min: 3500, max: 3999.99, fee: 555 },
    { min: 4000, max: 4499.99, fee: 600 },
    { min: 4500, max: 4999.99, fee: 625 },
    { min: 5000, max: 5499.99, fee: 650 },
    { min: 5500, max: 5999.99, fee: 675 },
    { min: 6000, max: 6499.99, fee: 700 },
    { min: 6500, max: 6999.99, fee: 720 },
    { min: 7000, max: 7499.99, fee: 755 },
    { min: 7500, max: 7999.99, fee: 775 },
    { min: 8000, max: 8499.99, fee: 800 },
    { min: 8500, max: 9999.99, fee: 820 },
    { min: 10000, max: 11499.99, fee: 850 },
    { min: 11500, max: 11999.99, fee: 860 },
    { min: 12000, max: 12499.99, fee: 875 },
    { min: 12500, max: 14999.99, fee: 890 },
    { min: 15000, max: Infinity, fee: '6.0%' }
  ]
}

/**
 * Calculate Copart fees (matches reference calculateCopartFees exactly)
 */
export function calculateCopartFees(
  price: number,
  account: CopartAccountType,
  title: CopartTitleType,
  payment: PaymentMethod,
  bid: BidType,
  feeEntries: Record<string, CopartFeeEntry>
) {
  const config = selectFeeEntry(account, title, feeEntries)

  const auctionFee = getFee(config.auction_fee[payment], price)
  const bidFee = getFee(config.virtual_bid_fee[bid], price)

  const total = auctionFee + bidFee + config.gate_fee + config.title_fee + config.env_fee

  return {
    total,
    breakdown: {
      auctionFee,
      bidFee,
      gateFee: config.gate_fee,
      titleFee: config.title_fee,
      envFee: config.env_fee,
    },
  }
}

/**
 * Calculate IAA fees (matches reference calculateIAAFees exactly)
 */
export function calculateIAAFees(
  price: number,
  buyerType: IAABuyerType,
  bidType: IAABidType
) {
  const buyFee = getFee(IAABuyerFees[buyerType], price)
  const bidFee = getFee(IAABidFees[bidType], price)
  const fixedFees = IAA_FIXED_FEES

  const total = buyFee + bidFee + fixedFees

  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      buyFee,
      bidFee,
      fixedFees
    }
  }
}

/**
 * Main calculation function for auction fees
 */
export function calculateAuctionFees(
  input: AuctionFeeInput,
  feeEntries?: Record<string, CopartFeeEntry>
): AuctionFeeOutput {
  // Validate input
  const validInput = AuctionFeeInputSchema.parse(input)
  
  if (validInput.auction === 'COPART') {
    if (!feeEntries) {
      throw new Error('Fee entries required for Copart calculations')
    }
    if (!validInput.accountType || !validInput.titleType || !validInput.payment) {
      throw new Error('Missing required Copart parameters: accountType, titleType, payment')
    }

    // Map salvage to non_clean for consistency
    const titleType: CopartTitleType = validInput.titleType === 'salvage' ? 'non_clean' : validInput.titleType as CopartTitleType

    const result = calculateCopartFees(
      validInput.carPriceUSD,
      validInput.accountType as CopartAccountType,
      titleType,
      validInput.payment as PaymentMethod,
      validInput.bidType as BidType,
      feeEntries
    )

    return AuctionFeeOutputSchema.parse({
      total: Math.round(result.total * 100) / 100,
      breakdown: result.breakdown,
      version: '2.0.0'
    })
  } else if (validInput.auction === 'IAA') {
    if (!validInput.buyerType) {
      throw new Error('Missing required IAA parameter: buyerType')
    }

    const result = calculateIAAFees(
      validInput.carPriceUSD,
      validInput.buyerType as IAABuyerType,
      validInput.iaaBidType as IAABidType
    )

    return AuctionFeeOutputSchema.parse({
      total: result.total,
      breakdown: result.breakdown,
      version: '2.0.0'
    })
  } else {
    throw new Error(`Unknown auction type: ${validInput.auction}`)
  }
}