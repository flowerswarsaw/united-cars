import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { z } from 'zod'
import { 
  getSession, 
  createStandardErrorResponse, 
  handleApiError,
  createApiResponse 
} from '@/lib/auth-utils'

const StatusUpdateSchema = z.object({
  status: z.enum(['new', 'investigating', 'approved', 'rejected', 'paid']),
  reviewNotes: z.string().optional(),
  payoutAmount: z.number().positive().optional()
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

    // Update status using mock database service
    const updatedClaim = await db.insuranceClaims.updateStatus(claimId, input.status)

    if (!updatedClaim) {
      return createStandardErrorResponse('NOT_FOUND', 'Insurance claim not found', 404)
    }

    return createApiResponse({ claim: updatedClaim })
  } catch (error) {
    return handleApiError(error)
  }
}
