import { NextRequest, NextResponse } from 'next/server'
import { calculateAuctionFees, AuctionFeeInputSchema, copartFeeEntries } from '@united-cars/calc'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input = AuctionFeeInputSchema.parse(body)

    // Calculate fees using static matrices
    const result = calculateAuctionFees(input, copartFeeEntries)

    // Save calculation to vehicle stage history if vehicleId provided
    if (body.vehicleId) {
      await prisma.vehicleStageHistory.create({
        data: {
          vehicleId: body.vehicleId,
          stage: 'auction_fee_calculation',
          dataJson: {
            input,
            output: result,
            calculatedAt: new Date().toISOString()
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Auction calculation error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    )
  }
}