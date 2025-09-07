import { NextRequest, NextResponse } from 'next/server'
import { calculateShipping, ShippingInputSchema } from '@united-cars/calc'
import { PrismaClient } from '@prisma/client'
import { shippingRulesMatrix, generalShippingFees } from '@united-cars/calc'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const input = ShippingInputSchema.parse(body)

    // Calculate shipping cost
    const result = calculateShipping(input, shippingRulesMatrix, generalShippingFees)

    // Save calculation to vehicle stage history if vehicleId provided
    if (body.vehicleId) {
      await prisma.vehicleStageHistory.create({
        data: {
          vehicleId: body.vehicleId,
          stage: 'shipping_cost_calculation',
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
    console.error('Shipping calculation error:', error)
    
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