import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { z } from 'zod'

// Simple auth helper
async function getSession(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie?.value) return null
    
    const decodedSession = decodeURIComponent(sessionCookie.value)
    const sessionData = JSON.parse(decodedSession)
    
    return sessionData.user ? { user: sessionData.user } : null
  } catch {
    return null
  }
}

const ReviewInputSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional()
})

// PATCH /api/intakes/[id]/review - Review intake (approve/reject)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const intakeId = params.id

    // Check if intake exists and is pending
    const existingIntake = await prisma.vehicleIntake.findUnique({
      where: { id: intakeId }
    })

    if (!existingIntake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    if (existingIntake.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Intake has already been ${existingIntake.status.toLowerCase()}` 
      }, { status: 400 })
    }

    // Update intake status
    const updatedIntake = await prisma.$transaction(async (tx) => {
      // Update the intake
      const intake = await tx.vehicleIntake.update({
        where: { id: intakeId },
        data: {
          status: input.action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          notes: input.notes ? 
            (existingIntake.notes ? `${existingIntake.notes}\n\nReview Notes: ${input.notes}` : `Review Notes: ${input.notes}`) 
            : existingIntake.notes
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          reviewedBy: {
            select: { id: true, name: true, email: true }
          },
          auctionLocation: {
            select: { id: true, name: true, code: true, state: true }
          },
          attachments: {
            select: {
              id: true,
              kind: true,
              filename: true,
              uploadedAt: true
            }
          },
          org: {
            select: { id: true, name: true, type: true }
          }
        }
      })

      // If approved, create a Vehicle record
      if (input.action === 'approve') {
        await tx.vehicle.create({
          data: {
            orgId: intake.orgId,
            vin: intake.vin,
            make: intake.make,
            model: intake.model,
            year: intake.year,
            status: 'SOURCING',
            priceUSD: intake.purchasePriceUSD,
            notes: intake.notes
          }
        })

        // Add audit log entry for vehicle creation
        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            orgId: intake.orgId,
            action: 'CREATE',
            entity: 'vehicle',
            entityId: intake.vin, // Use VIN as identifier since we don't have vehicle ID yet
            diffJson: {
              after: { 
                vin: intake.vin,
                make: intake.make,
                model: intake.model,
                year: intake.year,
                status: 'SOURCING',
                source: 'intake_approval'
              }
            }
          }
        })
      }

      // Add audit log entry for intake review
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          orgId: intake.orgId,
          action: 'UPDATE',
          entity: 'vehicle_intake',
          entityId: intake.id,
          diffJson: {
            before: { status: 'PENDING' },
            after: { 
              status: input.action === 'approve' ? 'APPROVED' : 'REJECTED',
              reviewedBy: session.user.id,
              reviewedAt: new Date().toISOString()
            }
          }
        }
      })

      return intake
    })

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
