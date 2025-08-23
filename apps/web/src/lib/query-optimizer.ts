/**
 * Query Optimization Utilities
 * Provides standardized, efficient query patterns to prevent N+1 queries
 * and reduce payload sizes across all API endpoints
 */

import { Prisma } from '@prisma/client'

/**
 * Standardized select patterns for common entities
 * Prevents over-fetching and provides consistent API responses
 */
export const SELECT_PATTERNS = {
  // Minimal user data for references
  user: {
    id: true,
    email: true,
    name: true
  },

  // Org data for listings and references
  org: {
    id: true,
    name: true,
    type: true
  },

  // Vehicle data optimized for listings
  vehicle: {
    id: true,
    vin: true,
    make: true,
    model: true,
    year: true,
    status: true,
    createdAt: true,
    updatedAt: true
  },

  // Vehicle data for detail pages
  vehicleDetailed: {
    id: true,
    vin: true,
    make: true,
    model: true,
    year: true,
    status: true,
    purchasePriceUSD: true,
    currentStage: true,
    createdAt: true,
    updatedAt: true
  },

  // Insurance claim listing data
  insuranceClaim: {
    id: true,
    status: true,
    incidentAt: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    version: true
  },

  // Service request listing data
  serviceRequest: {
    id: true,
    type: true,
    status: true,
    priceUSD: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    version: true
  },

  // Payment intent listing data
  paymentIntent: {
    id: true,
    method: true,
    amount: true,
    currency: true,
    status: true,
    ref: true,
    createdAt: true,
    version: true
  }
} as const

/**
 * Optimized include patterns that prevent N+1 queries
 */
export const INCLUDE_PATTERNS = {
  // Vehicle with org (direct relationship)
  vehicleWithOrg: {
    org: {
      select: SELECT_PATTERNS.org
    }
  },

  // Service request with vehicle and org (optimized)
  serviceRequestOptimized: {
    vehicle: {
      select: SELECT_PATTERNS.vehicle
    },
    org: {
      select: SELECT_PATTERNS.org
    }
  },

  // Insurance claim with vehicle and org (optimized)
  insuranceClaimOptimized: {
    vehicle: {
      select: SELECT_PATTERNS.vehicle
    },
    org: {
      select: SELECT_PATTERNS.org
    }
  },

  // Payment intent with org (direct)
  paymentIntentWithOrg: {
    org: {
      select: SELECT_PATTERNS.org
    }
  },

  // Audit log with user and org
  auditLogOptimized: {
    actor: {
      select: SELECT_PATTERNS.user
    },
    org: {
      select: SELECT_PATTERNS.org
    }
  }
} as const

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number
  perPage: number
  maxPerPage?: number
}

export const DEFAULT_PAGINATION: PaginationConfig = {
  page: 1,
  perPage: 25,
  maxPerPage: 100
}

export function validatePagination(params: Partial<PaginationConfig>): PaginationConfig {
  const page = Math.max(1, params.page || DEFAULT_PAGINATION.page)
  const requestedPerPage = params.perPage || DEFAULT_PAGINATION.perPage
  const maxPerPage = params.maxPerPage || DEFAULT_PAGINATION.maxPerPage || 100
  const perPage = Math.min(maxPerPage, Math.max(1, requestedPerPage))

  return { page, perPage, maxPerPage }
}

export function getPaginationSkipTake(config: PaginationConfig) {
  return {
    skip: (config.page - 1) * config.perPage,
    take: config.perPage
  }
}

/**
 * Standardized listing query function
 * Prevents N+1 queries and provides consistent response format
 */
export async function executeListingQuery<T>(
  model: any,
  options: {
    where: any
    include?: any
    select?: any
    orderBy?: any
    pagination: PaginationConfig
  }
): Promise<{
  data: T[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}> {
  const { skip, take } = getPaginationSkipTake(options.pagination)

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      ...(options.include && { include: options.include }),
      ...(options.select && { select: options.select }),
      orderBy: options.orderBy || { createdAt: 'desc' },
      skip,
      take
    }),
    model.count({ where: options.where })
  ])

  return {
    data,
    pagination: {
      page: options.pagination.page,
      perPage: options.pagination.perPage,
      total,
      totalPages: Math.ceil(total / options.pagination.perPage)
    }
  }
}

/**
 * Query optimization for vehicle listings with related data
 */
export async function getOptimizedVehicles(
  prisma: any,
  options: {
    where: any
    pagination: PaginationConfig
    includeRelations?: boolean
  }
) {
  return executeListingQuery(prisma.vehicle, {
    where: options.where,
    select: {
      ...SELECT_PATTERNS.vehicle,
      org: {
        select: SELECT_PATTERNS.org
      },
      // Include counts without loading full relations
      _count: options.includeRelations ? {
        serviceRequests: true,
        insuranceClaims: true,
        titles: true
      } : undefined
    },
    pagination: options.pagination
  })
}

/**
 * Query optimization for service requests with minimal vehicle/org data
 */
export async function getOptimizedServiceRequests(
  prisma: any,
  options: {
    where: any
    pagination: PaginationConfig
  }
) {
  return executeListingQuery(prisma.serviceRequest, {
    where: options.where,
    select: {
      ...SELECT_PATTERNS.serviceRequest,
      vehicle: {
        select: SELECT_PATTERNS.vehicle
      },
      org: {
        select: SELECT_PATTERNS.org
      }
    },
    pagination: options.pagination
  })
}

/**
 * Query optimization for insurance claims
 */
export async function getOptimizedInsuranceClaims(
  prisma: any,
  options: {
    where: any
    pagination: PaginationConfig
  }
) {
  return executeListingQuery(prisma.insuranceClaim, {
    where: options.where,
    select: {
      ...SELECT_PATTERNS.insuranceClaim,
      vehicle: {
        select: SELECT_PATTERNS.vehicle
      },
      org: {
        select: SELECT_PATTERNS.org
      }
    },
    pagination: options.pagination
  })
}

/**
 * Optimized dashboard queries that fetch minimal data efficiently
 */
export async function getOptimizedDashboardData(
  prisma: any,
  orgId: string,
  isAdmin: boolean = false
) {
  const baseWhere = isAdmin ? {} : { orgId }

  const [
    vehicleStats,
    claimStats,
    serviceStats,
    recentActivity
  ] = await Promise.all([
    // Vehicle statistics
    prisma.vehicle.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      }
    }),

    // Claim statistics  
    prisma.insuranceClaim.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      }
    }),

    // Service request statistics
    prisma.serviceRequest.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      }
    }),

    // Recent activity (limited to essential fields)
    prisma.auditLog.findMany({
      where: { orgId: isAdmin ? undefined : orgId },
      select: {
        id: true,
        action: true,
        entity: true,
        at: true,
        actor: {
          select: SELECT_PATTERNS.user
        }
      },
      orderBy: { at: 'desc' },
      take: 10
    })
  ])

  return {
    vehicleStats,
    claimStats,
    serviceStats,
    recentActivity
  }
}

/**
 * Batch data loader to prevent N+1 queries when loading related entities
 */
export class BatchLoader<K, V> {
  private batchSize: number = 100
  private cache = new Map<string, Promise<V | null>>()
  
  constructor(
    private loadFn: (keys: K[]) => Promise<V[]>,
    private keyFn: (item: V) => K,
    batchSize?: number
  ) {
    if (batchSize) this.batchSize = batchSize
  }

  async load(key: K): Promise<V | null> {
    const keyStr = String(key)
    
    if (this.cache.has(keyStr)) {
      return this.cache.get(keyStr)!
    }

    // For simplicity, load immediately. In production, implement batching logic
    const promise = this.loadBatch([key]).then(results => results[0] || null)
    this.cache.set(keyStr, promise)
    return promise
  }

  private async loadBatch(keys: K[]): Promise<V[]> {
    const results = await this.loadFn(keys)
    return results
  }

  clear() {
    this.cache.clear()
  }
}

/**
 * Response payload trimming utilities
 */
export function trimPayload<T extends Record<string, any>>(
  data: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const trimmed: Partial<T> = {}
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      trimmed[field] = data[field]
    }
  }
  
  return trimmed
}

export function trimArrayPayload<T extends Record<string, any>>(
  data: T[],
  allowedFields: (keyof T)[]
): Partial<T>[] {
  return data.map(item => trimPayload(item, allowedFields))
}

/**
 * API response optimization
 */
export function createOptimizedResponse<T>(
  data: T,
  options: {
    includeMetadata?: boolean
    responseTime?: number
    cacheHint?: string
  } = {}
) {
  const response: any = {
    success: true,
    data
  }

  if (options.includeMetadata) {
    response.metadata = {
      timestamp: new Date().toISOString(),
      ...(options.responseTime && { responseTime: `${options.responseTime}ms` }),
      ...(options.cacheHint && { cacheHint: options.cacheHint })
    }
  }

  return response
}