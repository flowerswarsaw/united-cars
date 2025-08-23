import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
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
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const roles = session.user.roles || []
    const titleId = params.id

    // Validate ID format
    if (!titleId || typeof titleId !== 'string') {
      return createErrorResponse(ErrorCode.VALIDATION_ERROR, {
        details: 'Invalid title ID format',
        field: 'id'
      })
    }

    // Build where clause based on user role
    let whereClause: any = { id: titleId }
    
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's vehicles' titles
      whereClause.vehicle = {
        orgId: session.user.orgId
      }
    }

    const title = await prisma.title.findFirst({
      where: whereClause,
      select: {
        id: true,
        vin: true,
        make: true,
        model: true,
        year: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        vehicle: {
          select: { 
            id: true, 
            vin: true, 
            make: true, 
            model: true, 
            year: true,
            status: true,
            org: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        package: {
          select: { 
            id: true, 
            trackingNumber: true, 
            provider: true, 
            status: true,
            type: true,
            shippedAt: true,
            deliveredAt: true
          }
        }
      }
    })

    if (!title) {
      throw new NotFoundError('Title')
    }

    return NextResponse.json(createApiResponse({ title }))
  },
  { path: '/api/titles/[id]', method: 'GET' }
)
