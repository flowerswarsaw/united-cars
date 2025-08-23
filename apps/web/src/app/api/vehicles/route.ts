import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { 
  getSession, 
  buildOrgWhereClause
} from '@/lib/auth-utils'
import { 
  getOptimizedVehicles,
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

    // Build optimized where clause with org scoping
    let whereClause: any = buildOrgWhereClause(session.user)

    // Add status filter
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Add search filter (optimized for performance)
    if (search) {
      whereClause.OR = [
        { vin: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Use optimized query that prevents N+1 queries and includes relationship counts
    const result = await getOptimizedVehicles(prisma, {
      where: whereClause,
      pagination,
      includeRelations
    })

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      createOptimizedResponse(
        {
          vehicles: result.data,
          pagination: result.pagination
        },
        {
          includeMetadata: true,
          responseTime,
          cacheHint: includeRelations ? 'max-age=30' : 'max-age=120' // Different cache based on complexity
        }
      )
    )
  },
  { path: '/api/vehicles', method: 'GET' }
)