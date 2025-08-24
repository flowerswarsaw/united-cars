import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { CreateServiceRequestSchema } from '@united-cars/core'
import { 
  getSession, 
  buildOrgWhereClause
} from '@/lib/auth-utils'
import { 
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

    // Build filter for mock database
    const filter: any = {
      where: {},
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all service requests
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    // Add status filter
    if (status && ['pending', 'approved', 'completed', 'rejected'].includes(status)) {
      filter.where.status = status
    }

    // Add type filter
    if (type && ['INSPECTION', 'REPAIR', 'CLEANING', 'DOCUMENTATION', 'OTHER'].includes(type.toUpperCase())) {
      filter.where.type = type.toUpperCase()
    }

    // Add search filter - for mock data, we'll search by vehicleId
    if (search) {
      const vehicles = await db.vehicles.findMany({
        where: {
          OR: [
            { vin: { contains: search } },
            { make: { contains: search } },
            { model: { contains: search } }
          ]
        }
      })
      if (vehicles.data.length > 0) {
        filter.where.vehicleId = { in: vehicles.data.map((v: any) => v.id) }
      } else {
        // No matching vehicles, return empty result
        filter.where.vehicleId = 'no-match'
      }
    }

    // Use mock database service
    const serviceRequests = await db.serviceRequests.findMany(filter)

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      createOptimizedResponse(
        {
          serviceRequests: serviceRequests,
          pagination: {
            page: pagination.page,
            perPage: pagination.perPage,
            total: serviceRequests.length,
            totalPages: Math.ceil(serviceRequests.length / pagination.perPage)
          }
        },
        {
          includeMetadata: true,
          responseTime,
          cacheHint: 'max-age=60'
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
      const vehicle = await db.vehicles.findById(input.vehicleId)

      if (!vehicle || vehicle.orgId !== session.user.orgId) {
        throw new NotFoundError('Vehicle')
      }
    }

    // Create service request using mock database
    const serviceRequestData = {
      ...input,
      orgId: session.user.orgId!,
      status: 'pending' as const
    }

    // For mock data, we'll create a basic service request object
    const serviceRequest = {
      id: `service-${Date.now()}`,
      ...serviceRequestData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    return NextResponse.json(
      { success: true, serviceRequest }, 
      { status: 201 }
    )
  },
  { path: '/api/services', method: 'POST' }
)