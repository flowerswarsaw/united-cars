import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { CreateInsuranceClaimSchema } from '@united-cars/core'
import { 
  getSession, 
  buildOrgWhereClause
} from '@/lib/auth-utils'
import {
  withErrorHandler,
  createErrorResponse,
  ErrorCode,
  NotFoundError
} from '@/lib/error-handler'
import { 
  getOptimizedInsuranceClaims,
  validatePagination
} from '@/lib/query-optimizer'
import { logger, LogCategory, RequestContext } from '@/lib/logger'

// GET /api/claims - List insurance claims for current org with pagination and search
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const pagination = validatePagination({
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '25')
    })
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build optimized where clause with org scoping
    let whereClause: any = buildOrgWhereClause(session.user)
    
    // Apply status filter if provided
    if (status && ['new', 'review', 'approved', 'rejected', 'paid'].includes(status)) {
      whereClause.status = status
    }

    // Add search filter (optimized to search vehicle relation efficiently)
    if (search) {
      whereClause.vehicle = {
        vin: { contains: search, mode: 'insensitive' }
      }
    }

    // Use optimized query that prevents N+1 queries
    const result = await getOptimizedInsuranceClaims(prisma, {
      where: whereClause,
      pagination
    })

    return NextResponse.json({
      success: true,
      claims: result.data,
      pagination: result.pagination
    })
  },
  { path: '/api/claims', method: 'GET' }
)

// POST /api/claims - Create new insurance claim (Dealers only)
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
    const input = CreateInsuranceClaimSchema.parse(body)
    
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

    const requestContext = new RequestContext(
      request.headers.get('x-request-id') || 'unknown',
      session.user.id,
      session.user.orgId,
      request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      request.headers.get('user-agent') || undefined
    )

    // Create insurance claim
    const claim = await prisma.insuranceClaim.create({
      data: {
        vehicleId: input.vehicleId,
        orgId: session.user.orgId!,
        description: input.description,
        incidentAt: input.incidentAt ? new Date(input.incidentAt) : null,
        photos: input.photos || null,
        status: 'new' as const
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

    // Log business event
    logger.business(
      requestContext.withContext({
        entity: 'claim',
        action: 'CREATE',
        entityId: claim.id,
        newState: {
          status: claim.status,
          vehicleVin: claim.vehicle?.vin,
          description: input.description.substring(0, 100) + (input.description.length > 100 ? '...' : ''),
          photosCount: input.photos?.length || 0
        }
      })
    )

    // Add audit log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        orgId: session.user.orgId!,
        action: 'CREATE',
        entity: 'insurance_claim',
        entityId: claim.id,
        diffJson: {
          after: { 
            vehicleId: input.vehicleId,
            description: input.description,
            incidentAt: input.incidentAt,
            photosCount: input.photos?.length || 0
          }
        }
      }
    })

    return NextResponse.json(
      { success: true, claim }, 
      { status: 201 }
    )
  },
  { path: '/api/claims', method: 'POST' }
)