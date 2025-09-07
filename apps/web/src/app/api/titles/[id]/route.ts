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

// GET /api/titles/[id] - Get specific title details
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const roles = session.user.roles || []
    const { id: titleId } = await params

    // Validate ID format
    if (!titleId || typeof titleId !== 'string') {
      return createErrorResponse(ErrorCode.VALIDATION_ERROR, {
        details: 'Invalid title ID format',
        field: 'id'
      })
    }

    // Get title with role-based filtering
    const title = await db.titles.findById(titleId)

    if (!title) {
      throw new NotFoundError('Title')
    }

    // Check access based on role
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's vehicles' titles
      if (title.vehicle?.org?.id !== session.user.orgId) {
        throw new NotFoundError('Title')
      }
    }

    return createApiResponse({ title })
  },
  { path: '/api/titles/[id]', method: 'GET' }
)
