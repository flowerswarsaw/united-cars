import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { CreateServiceRequestSchema } from '@united-cars/core'
import { 
  getSession, 
  buildOrgWhereClause
} from '@/lib/auth-utils'
import { 
  getOptimizedServiceRequests,
  validatePagination as validatePaginationConfig,
  createOptimizedResponse
} from '@/lib/query-optimizer'
import {
  withErrorHandler,
  createErrorResponse,
  ErrorCode,
  NotFoundError
} from '@/lib/error-handler'

// GET /api/services - List service requests for current org with pagination and search
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const startTime = Date.now()
    
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const pagination = validatePaginationConfig({
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '25')
    })

    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build optimized where clause with org scoping
    let whereClause: any = buildOrgWhereClause(session.user)
    
    // Add status filter
    if (status && ['pending', 'approved', 'in_progress', 'completed', 'rejected'].includes(status)) {
      whereClause.status = status
    }

    // Add type filter
    if (type && ['inspection', 'cleaning', 'repair', 'storage', 'titlework'].includes(type)) {
      whereClause.type = type
    }

    // Add search filter (optimized to search vehicle relation efficiently)
    if (search) {
      whereClause.vehicle = {
        OR: [
          { vin: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // Use optimized query that prevents N+1 queries
    const result = await getOptimizedServiceRequests(prisma, {
      where: whereClause,
      pagination
    })

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      createOptimizedResponse(
        {
          serviceRequests: result.data,
          pagination: result.pagination
        },
        {
          includeMetadata: true,
          responseTime,
          cacheHint: 'max-age=60' // Cache for 1 minute
        }
      )
    )
  },
  { path: '/api/services', method: 'GET' }
)

// POST /api/services - Create new service request (Dealers only)
export const POST = withErrorHandler(
  async (request: NextRequest) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const roles = session.user.roles || []
    if (!roles.includes('DEALER') && !roles.includes('ADMIN')) {
      return createErrorResponse(ErrorCode.FORBIDDEN)
    }

    const body = await request.json()
    
    // Validate input
    const input = CreateServiceRequestSchema.parse(body)
    
    // Verify vehicle belongs to dealer's org (unless admin)
    if (!roles.includes('ADMIN')) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: input.vehicleId,
          orgId: session.user.orgId
        }
      })

      if (!vehicle) {
        throw new NotFoundError('Vehicle')
      }
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ...input,
        orgId: session.user.orgId!,
        status: 'pending'
      },
      include: {
        vehicle: {
          select: { 
            id: true, 
            vin: true, 
            make: true, 
            model: true, 
            year: true 
          }
        },
        org: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    // Add audit log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        orgId: session.user.orgId!,
        action: 'CREATE',
        entity: 'service_request',
        entityId: serviceRequest.id,
        diffJson: {
          after: { 
            type: input.type, 
            vehicleId: input.vehicleId, 
            notes: input.notes 
          }
        }
      }
    })

    return NextResponse.json(
      { success: true, serviceRequest }, 
      { status: 201 }
    )
  },
  { path: '/api/services', method: 'POST' }
)