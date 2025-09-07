import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { z } from 'zod'
import { getSession } from '@/lib/auth-utils'

const ReviewInputSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional()
})

// PATCH /api/intakes/[id]/review - Review intake (approve/reject)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const input = ReviewInputSchema.parse(body)
    const { id: intakeId } = await params

    // Check if intake exists and is pending
    const existingIntake = await db.vehicleIntakes.findById(intakeId)

    if (!existingIntake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    if (existingIntake.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Intake has already been ${existingIntake.status.toLowerCase()}` 
      }, { status: 400 })
    }

    // Update intake status using mock database
    let updatedIntake
    if (input.action === 'approve') {
      updatedIntake = await db.vehicleIntakes.approve(intakeId, session.user.id)
      
      // If approved, create a comprehensive Vehicle record
      if (updatedIntake) {
        const vehicleData = {
          orgId: updatedIntake.orgId,
          vin: updatedIntake.vin,
          make: updatedIntake.make,
          model: updatedIntake.model,
          year: updatedIntake.year,
          purchasePriceUSD: updatedIntake.purchasePriceUSD,
          status: 'SOURCING',
          currentStage: 'auction_won',
          // Add shipping and logistics info
          metadata: {
            intakeId: updatedIntake.id,
            auction: updatedIntake.auction,
            auctionLot: updatedIntake.auctionLot,
            usPort: updatedIntake.usPort,
            destinationPort: updatedIntake.destinationPort,
            insurance: updatedIntake.insurance,
            paymentMethod: updatedIntake.paymentMethod,
            isPrivateLocation: updatedIntake.isPrivateLocation,
            pickupAddress: updatedIntake.pickupAddress,
            contactPerson: updatedIntake.contactPerson,
            contactPhone: updatedIntake.contactPhone,
            paymentConfirmations: updatedIntake.paymentConfirmations || []
          },
          notes: updatedIntake.notes
        }
        
        const newVehicle = await db.vehicles.create(vehicleData)
        
        // Log the successful vehicle creation
        console.log(`✅ Vehicle created successfully: ${newVehicle.vin} (${newVehicle.id}) - Status: ${newVehicle.status}`)
      }
    } else {
      updatedIntake = await db.vehicleIntakes.reject(intakeId, session.user.id)
    }

    // Update notes if provided
    if (input.notes && updatedIntake) {
      const existingNotes = updatedIntake.notes || ''
      updatedIntake.notes = existingNotes 
        ? `${existingNotes}\n\nReview Notes: ${input.notes}` 
        : `Review Notes: ${input.notes}`
    }

    if (!updatedIntake) {
      return NextResponse.json({ error: 'Failed to update intake' }, { status: 500 })
    }

    return NextResponse.json({ success: true, intake: updatedIntake })
  } catch (error: any) {
    console.error('Review intake error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
