import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { 
  getSession, 
  createApiResponse
} from '@/lib/auth-utils'
import { 
  withErrorHandler,
  createErrorResponse,
  ErrorCode,
  NotFoundError
} from '@/lib/error-handler'

// GET /api/intakes/[id] - Get specific intake details
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id: intakeId } = await params
    const roles = session.user.roles || []

    // Get intake from mock database
    const intake = await db.vehicleIntakes.findById(intakeId)

    if (!intake) {
      throw new NotFoundError('Vehicle intake')
    }

    // Check permissions - users can only see their own intakes unless admin
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      if (intake.orgId !== session.user.orgId) {
        throw new NotFoundError('Vehicle intake')
      }
    }

    // Populate user relationships
    const createdByUser = intake.createdById ? await db.users.findUnique({ where: { id: intake.createdById } }) : null
    const reviewedByUser = intake.reviewedById ? await db.users.findUnique({ where: { id: intake.reviewedById } }) : null
    const org = intake.orgId ? await db.organizations.findById(intake.orgId) : null

    // Format the intake with populated data
    const formattedIntake = {
      ...intake,
      createdBy: createdByUser ? {
        id: createdByUser.id,
        name: createdByUser.name || 'Unknown',
        email: createdByUser.email
      } : null,
      reviewedBy: reviewedByUser ? {
        id: reviewedByUser.id,
        name: reviewedByUser.name || 'Unknown',
        email: reviewedByUser.email
      } : null,
      org: org ? {
        id: org.id,
        name: org.name,
        type: org.type
      } : null,
      attachments: intake.attachments || []
    }

    return createApiResponse({ intake: formattedIntake })
  },
  { path: '/api/intakes/[id]', method: 'GET' }
)

// DELETE /api/intakes/[id] - Delete/Retract an intake (dealers only, for their own pending intakes)
export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id: intakeId } = await params
    const roles = session.user.roles || []

    // Get intake from mock database
    const intake = await db.vehicleIntakes.findById(intakeId)

    if (!intake) {
      throw new NotFoundError('Vehicle intake')
    }

    // Only dealers can retract, and only their own pending intakes
    if (!roles.includes('DEALER')) {
      return createErrorResponse(ErrorCode.FORBIDDEN, 'Only dealers can retract intakes')
    }

    if (intake.orgId !== session.user.orgId) {
      return createErrorResponse(ErrorCode.FORBIDDEN, 'You can only retract your own intakes')
    }

    if (intake.status !== 'PENDING') {
      return createErrorResponse(ErrorCode.BAD_REQUEST, 'Only pending intakes can be retracted')
    }

    // Delete the intake
    await db.vehicleIntakes.delete(intakeId)

    return createApiResponse({ 
      success: true,
      message: 'Intake retracted successfully'
    })
  },
  { path: '/api/intakes/[id]', method: 'DELETE' }
)
