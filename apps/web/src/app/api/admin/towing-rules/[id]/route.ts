import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// GET: Fetch a specific towing rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const towingRule = await prisma.towingRule.findUnique({
      where: { id },
      include: {
        auctionLocation: true,
        deliveryPort: true,
        shipper: true,
      },
    })

    if (!towingRule) {
      return NextResponse.json(
        { success: false, error: 'Towing rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: towingRule,
    })
  } catch (error) {
    console.error('Error fetching towing rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch towing rule' },
      { status: 500 }
    )
  }
}

// PUT: Update a towing rule
const UpdateTowingRuleSchema = z.object({
  basePrice: z.number().min(0).optional(),
  ruleType: z.enum(['FLAT', 'MULTIPLIER', 'CATEGORY']).optional(),
  perTypeJson: z.record(z.any()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const validatedData = UpdateTowingRuleSchema.parse(body)

    const towingRule = await prisma.towingRule.update({
      where: { id },
      data: validatedData,
      include: {
        auctionLocation: true,
        deliveryPort: true,
        shipper: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: towingRule,
    })
  } catch (error) {
    console.error('Error updating towing rule:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update towing rule' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a towing rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.towingRule.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Towing rule deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting towing rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete towing rule' },
      { status: 500 }
    )
  }
}