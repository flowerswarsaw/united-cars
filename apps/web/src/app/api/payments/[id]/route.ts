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

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id } = await params
    const roles = session.user.roles || []

    const payment = await db.paymentIntents.findById(id)

    if (!payment) {
      throw new NotFoundError('Payment')
    }

    // Check access based on role
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's payments
      if (payment.orgId !== session.user.orgId) {
        throw new NotFoundError('Payment')
      }
    }

    return createApiResponse({ payment })
  },
  { path: '/api/payments/[id]', method: 'GET' }
)

export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id } = await params
    const body = await request.json()
    const roles = session.user.roles || []

    // Check if user has permission to update payments
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return createErrorResponse(ErrorCode.FORBIDDEN, {
        details: 'Insufficient permissions to update payments'
      })
    }

    const payment = await db.paymentIntents.findById(id)
    if (!payment) {
      throw new NotFoundError('Payment')
    }

    // For mock database, we'll just return the same payment with updated status
    // In real implementation, this would update the database
    const updatedPayment = {
      ...payment,
      status: body.status || payment.status,
      ref: body.ref || payment.ref,
      updatedAt: new Date(),
      version: payment.version + 1
    }

    return createApiResponse({ payment: updatedPayment })
  },
  { path: '/api/payments/[id]', method: 'PATCH' }
)