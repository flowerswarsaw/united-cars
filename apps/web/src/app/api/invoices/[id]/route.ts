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

    // Try to find by ID first, then by invoice number
    let invoice = await db.invoices.findById(id)
    if (!invoice) {
      invoice = await db.invoices.findByNumber(id)
    }

    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    // Check access based on role
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's invoices
      if (invoice.orgId !== session.user.orgId) {
        throw new NotFoundError('Invoice')
      }
    }

    return createApiResponse({ invoice })
  },
  { path: '/api/invoices/[id]', method: 'GET' }
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

    // Check if user has permission to update invoices
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return createErrorResponse(ErrorCode.FORBIDDEN, {
        details: 'Insufficient permissions to update invoices'
      })
    }

    // Try to find by ID first, then by invoice number
    let invoice = await db.invoices.findById(id)
    if (!invoice) {
      invoice = await db.invoices.findByNumber(id)
    }
    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    // For mock database, we'll just return the same invoice with updated status
    const updatedInvoice = {
      ...invoice,
      status: body.status || invoice.status,
      notes: body.notes !== undefined ? body.notes : invoice.notes,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : invoice.issuedAt,
      updatedAt: new Date()
    }

    return createApiResponse({ invoice: updatedInvoice })
  },
  { path: '/api/invoices/[id]', method: 'PATCH' }
)