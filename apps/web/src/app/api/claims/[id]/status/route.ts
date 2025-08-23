import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { z } from 'zod'
import { 
  getSession, 
  createStandardErrorResponse, 
  handleApiError,
  createApiResponse 
} from '@/lib/auth-utils'
import { 
  performStatusUpdate, 
  createConcurrencyErrorResponse,
  checkIdempotency,
  recordIdempotencyKey
} from '@/lib/concurrency'

const StatusUpdateSchema = z.object({
  status: z.enum(['new', 'review', 'approved', 'rejected', 'paid']),
  reviewNotes: z.string().optional(),
  payoutAmount: z.number().positive().optional(),
  version: z.number().int().nonnegative(), // Required for optimistic locking
  idempotencyKey: z.string().optional() // Client-generated key to prevent duplicates
})

// PATCH /api/claims/[id]/status - Update insurance claim status (Admin/OPS only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return createStandardErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }

    const roles = session.user.roles || []
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return createStandardErrorResponse('FORBIDDEN', 'Insufficient permissions', 403)
    }

    const body = await request.json()
    const input = StatusUpdateSchema.parse(body)
    const claimId = params.id

    // Check for idempotency if key provided
    if (input.idempotencyKey) {
      const existingOperation = await checkIdempotency({
        key: input.idempotencyKey,
        entityType: 'insurance_claim',
        userId: session.user.id,
        operation: 'update_status'
      })

      if (existingOperation) {
        // Return the previous result
        const result = existingOperation.result ? JSON.parse(existingOperation.result) : null
        return createApiResponse({ claim: result, wasIdempotent: true })
      }
    }

    // Check if claim exists
    const existingClaim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        vehicle: {
          select: { id: true, vin: true, make: true, model: true, year: true, orgId: true }
        },
        org: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingClaim) {
      return createStandardErrorResponse('NOT_FOUND', 'Insurance claim not found', 404)
    }

    // Prepare update data with review notes
    let updatedDescription = existingClaim.description || ''
    if (input.reviewNotes) {
      const reviewNote = `\n\n--- Review Notes (${new Date().toLocaleDateString()}) ---\n${input.reviewNotes}`
      updatedDescription += reviewNote
    }

    // Add payout information for paid claims
    if (input.status === 'paid' && input.payoutAmount) {
      const payoutNote = `\n\n--- Payout Information ---\nAmount: $${input.payoutAmount.toFixed(2)}\nProcessed: ${new Date().toLocaleDateString()}`
      updatedDescription += payoutNote
    }

    // Perform optimistic status update with concurrency control
    const result = await performStatusUpdate({
      entityType: 'insurance_claim',
      id: claimId,
      expectedVersion: input.version,
      newStatus: input.status,
      updateData: {
        description: updatedDescription
      },
      include: {
        vehicle: {
          select: { 
            id: true, 
            vin: true, 
            make: true, 
            model: true, 
            year: true,
            org: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        org: {
          select: { id: true, name: true, type: true }
        }
      },
      auditInfo: {
        actorUserId: session.user.id,
        orgId: existingClaim.orgId,
        diffJson: {
          before: { 
            status: existingClaim.status,
            description: existingClaim.description
          },
          after: { 
            status: input.status,
            description: updatedDescription,
            reviewNotes: input.reviewNotes,
            payoutAmount: input.payoutAmount
          }
        }
      }
    })

    if (!result.success) {
      if (result.error.code === 'CONCURRENT_MODIFICATION') {
        return createConcurrencyErrorResponse(result.error)
      } else {
        return createStandardErrorResponse(
          result.error.code as any,
          result.error.message,
          400
        )
      }
    }

    const updatedClaim = result.data

    // Create payment record for paid claims (separate transaction to avoid conflicts)
    if (input.status === 'paid' && input.payoutAmount) {
      try {
        await prisma.payment.create({
          data: {
            orgId: existingClaim.orgId,
            amount: input.payoutAmount,
            currency: 'USD',
            method: 'bank_transfer',
            status: 'completed',
            description: `Insurance claim payout for ${existingClaim.vehicle.year || ''} ${existingClaim.vehicle.make || ''} ${existingClaim.vehicle.model || ''} (VIN: ${existingClaim.vehicle.vin})`,
            metadata: {
              claimId: claimId,
              vehicleId: existingClaim.vehicleId,
              type: 'insurance_payout'
            },
            processedAt: new Date()
          }
        })
      } catch (paymentError) {
        console.error('Payment creation failed after successful status update:', paymentError)
        // Log the issue but don't fail the entire operation since status was updated
      }
    }

    // Record idempotency key if provided
    if (input.idempotencyKey) {
      try {
        await recordIdempotencyKey(
          {
            key: input.idempotencyKey,
            entityType: 'insurance_claim',
            userId: session.user.id,
            operation: 'update_status'
          },
          updatedClaim
        )
      } catch (idempotencyError) {
        console.error('Failed to record idempotency key:', idempotencyError)
        // Don't fail the operation
      }
    }

    return createApiResponse({ claim: updatedClaim })
  } catch (error) {
    return handleApiError(error)
  }
}
