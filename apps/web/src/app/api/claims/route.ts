import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
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
  validatePagination
} from '@/lib/query-optimizer'

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

    // Build filter for mock database
    const filter: any = {
      where: {},
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all claims
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    // Apply status filter if provided
    if (status && ['new', 'investigating', 'approved', 'rejected', 'paid'].includes(status)) {
      filter.where.status = status
    }

    // Add search filter - for mock data, we'll search by vehicleId
    if (search) {
      // In mock data, we can search by vehicleId directly
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
    const claims = await db.insuranceClaims.findMany(filter)

    return NextResponse.json({
      success: true,
      claims: claims,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
        total: claims.length,
        totalPages: Math.ceil(claims.length / pagination.perPage)
      }
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
      const vehicle = await db.vehicles.findById(input.vehicleId)

      if (!vehicle || vehicle.orgId !== session.user.orgId) {
        throw new NotFoundError('Vehicle')
      }
    }

    // Create insurance claim using mock database
    const claimData = {
      vehicleId: input.vehicleId,
      orgId: session.user.orgId!,
      description: input.description,
      incidentAt: input.incidentAt ? new Date(input.incidentAt) : null,
      photos: input.photos || null,
      status: 'new' as const
    }

    // For mock data, we'll create a basic claim object
    const claim = {
      id: `claim-${Date.now()}`,
      ...claimData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    return NextResponse.json(
      { success: true, claim }, 
      { status: 201 }
    )
  },
  { path: '/api/claims', method: 'POST' }
)