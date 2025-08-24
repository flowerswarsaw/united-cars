import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { 
  getSession, 
  buildOrgWhereClause
} from '@/lib/auth-utils'
import { 
  validatePagination,
  createOptimizedResponse
} from '@/lib/query-optimizer'
import {
  withErrorHandler,
  createErrorResponse,
  ErrorCode
} from '@/lib/error-handler'

// GET /api/vehicles - List vehicles for current org with pagination and search
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const startTime = Date.now()
    
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
    const includeRelations = searchParams.get('include') === 'relations'

    // Build filter for mock database
    const filter: any = {
      where: {},
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all vehicles
    } else {
      filter.where.orgId = session.user.orgId
    }

    // Add status filter
    if (status && status !== 'all') {
      filter.where.status = status
    }

    // Add search filter
    if (search) {
      filter.where.OR = [
        { vin: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } }
      ]
    }

    // Use mock database service
    const result = await db.vehicles.findMany(filter)

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      createOptimizedResponse(
        {
          vehicles: result.data,
          pagination: {
            page: result.page,
            perPage: result.perPage,
            total: result.total,
            totalPages: result.totalPages
          }
        },
        {
          includeMetadata: true,
          responseTime,
          cacheHint: includeRelations ? 'max-age=30' : 'max-age=120'
        }
      )
    )
  },
  { path: '/api/vehicles', method: 'GET' }
)