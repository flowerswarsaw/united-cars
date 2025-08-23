import { NextRequest, NextResponse } from 'next/server'
import { calculateAuctionFees, AuctionFeeInputSchema } from '@united-cars/calc'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input = AuctionFeeInputSchema.parse(body)

    // Fetch fee matrices from database
    const matrices = await prisma.auctionFeeMatrix.findMany({
      where: {
        auction: input.auction,
        accountType: input.accountType as any,
        title: input.titleType.toUpperCase() as any,
        payment: input.payment.toUpperCase() as any
      }
    })

    if (matrices.length === 0) {
      return NextResponse.json(
        { error: 'No fee matrix found for the specified parameters' },
        { status: 404 }
      )
    }

    // Convert database format to calculator format
    const calculatorMatrices = matrices.map(matrix => ({
      auction: matrix.auction,
      accountType: matrix.accountType,
      title: matrix.title.toLowerCase(),
      payment: matrix.payment.toLowerCase(),
      brackets: matrix.bracketsJson as any[]
    }))

    // Calculate fees
    const result = calculateAuctionFees(input, calculatorMatrices)

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