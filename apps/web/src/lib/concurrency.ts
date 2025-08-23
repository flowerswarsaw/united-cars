import { prisma } from '@united-cars/db'
import { createStandardErrorResponse } from './auth-utils'
import { NextResponse } from 'next/server'

export interface OptimisticUpdateOptions {
  entityType: 'insurance_claim' | 'service_request' | 'payment_intent' | 'invoice'
  id: string
  expectedVersion: number
  updateData: Record<string, any>
  include?: Record<string, any>
  auditInfo?: {
    actorUserId: string
    orgId: string
    diffJson?: Record<string, any>
  }
}

export interface ConcurrencyError {
  code: 'CONCURRENT_MODIFICATION'
  message: string
  currentVersion: number
  expectedVersion: number
}

/**
 * Performs optimistic concurrency-controlled update
 * Increments version and validates no concurrent modifications occurred
 */
export async function performOptimisticUpdate<T = any>(
  options: OptimisticUpdateOptions
): Promise<{ success: true; data: T } | { success: false; error: ConcurrencyError }> {
  const { entityType, id, expectedVersion, updateData, include, auditInfo } = options

  try {
    // Map entity types to Prisma table names
    const tableMap = {
      insurance_claim: 'insuranceClaim',
      service_request: 'serviceRequest', 
      payment_intent: 'paymentIntent',
      invoice: 'invoice'
    } as const

    const table = tableMap[entityType]
    if (!table) {
      throw new Error(`Unsupported entity type: ${entityType}`)
    }

    // Perform the optimistic update within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, check current version
      const current = await (tx as any)[table].findUnique({
        where: { id },
        select: { version: true }
      })

      if (!current) {
        throw new Error('Entity not found')
      }

      if (current.version !== expectedVersion) {
        return {
          success: false as const,
          error: {
            code: 'CONCURRENT_MODIFICATION' as const,
            message: `Record was modified by another user. Expected version ${expectedVersion}, found ${current.version}.`,
            currentVersion: current.version,
            expectedVersion
          }
        }
      }

      // Perform the update with version increment
      const updated = await (tx as any)[table].update({
        where: { 
          id,
          version: expectedVersion // Double-check version in where clause
        },
        data: {
          ...updateData,
          version: expectedVersion + 1,
          updatedAt: new Date()
        },
        include
      })

      // Add audit log if provided
      if (auditInfo) {
        await tx.auditLog.create({
          data: {
            actorUserId: auditInfo.actorUserId,
            orgId: auditInfo.orgId,
            action: 'UPDATE',
            entity: entityType,
            entityId: id,
            diffJson: {
              versionChange: { from: expectedVersion, to: expectedVersion + 1 },
              ...auditInfo.diffJson
            }
          }
        })
      }

      return { success: true as const, data: updated }
    })

    return result
  } catch (error) {
    console.error('Optimistic update failed:', error)
    return {
      success: false,
      error: {
        code: 'CONCURRENT_MODIFICATION',
        message: 'Update failed due to concurrent modification',
        currentVersion: -1,
        expectedVersion
      }
    }
  }
}

/**
 * Handle concurrent modification error response
 */
export function createConcurrencyErrorResponse(error: ConcurrencyError): NextResponse {
  return createStandardErrorResponse(
    'CONCURRENT_MODIFICATION',
    error.message,
    409, // Conflict status
    `Please refresh and try again. Current version: ${error.currentVersion}`
  )
}

/**
 * Validate status transition for state machines
 */
export interface StatusTransition {
  from: string
  to: string
  allowedTransitions: Record<string, string[]>
}

export function validateStatusTransition(transition: StatusTransition): boolean {
  const { from, to, allowedTransitions } = transition
  return allowedTransitions[from]?.includes(to) ?? false
}

/**
 * Predefined status transition rules
 */
export const STATUS_TRANSITIONS = {
  insuranceClaim: {
    new: ['review', 'rejected'],
    review: ['approved', 'rejected'], 
    approved: ['paid', 'rejected'],
    rejected: [], // Terminal state
    paid: [] // Terminal state
  },
  serviceRequest: {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // Terminal state
    cancelled: [] // Terminal state  
  },
  paymentIntent: {
    SUBMITTED: ['PROCESSING', 'REJECTED'],
    PROCESSING: ['COMPLETED', 'FAILED'],
    COMPLETED: [], // Terminal state
    FAILED: ['SUBMITTED'], // Can retry
    REJECTED: [] // Terminal state
  }
} as const

/**
 * Create optimistic update with status validation
 */
export async function performStatusUpdate<T = any>(
  options: OptimisticUpdateOptions & {
    newStatus: string
    statusField?: string
  }
): Promise<{ success: true; data: T } | { success: false; error: ConcurrencyError | { code: 'INVALID_TRANSITION'; message: string } }> {
  const { entityType, newStatus, statusField = 'status' } = options

  // Get current record to validate transition
  const tableMap = {
    insurance_claim: 'insuranceClaim',
    service_request: 'serviceRequest',
    payment_intent: 'paymentIntent',
    invoice: 'invoice'
  } as const

  const table = tableMap[entityType]
  if (!table) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `Unsupported entity type: ${entityType}`
      }
    }
  }

  try {
    const current = await (prisma as any)[table].findUnique({
      where: { id: options.id },
      select: { [statusField]: true }
    })

    if (!current) {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Entity not found'
        }
      }
    }

    const currentStatus = current[statusField]
    const allowedTransitions = STATUS_TRANSITIONS[entityType as keyof typeof STATUS_TRANSITIONS] as Record<string, string[]>
    
    if (!validateStatusTransition({ 
      from: currentStatus, 
      to: newStatus, 
      allowedTransitions 
    })) {
      return {
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`
        }
      }
    }

    // Proceed with optimistic update
    return await performOptimisticUpdate<T>({
      ...options,
      updateData: {
        ...options.updateData,
        [statusField]: newStatus
      }
    })
  } catch (error) {
    console.error('Status update validation failed:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Status validation failed'
      }
    }
  }
}

/**
 * Idempotency key utilities
 */
export interface IdempotencyOptions {
  key: string
  entityType: string
  userId: string
  operation: string
  expiryMinutes?: number
}

export async function checkIdempotency(options: IdempotencyOptions) {
  const { key, entityType, userId, operation, expiryMinutes = 60 } = options
  
  const existingOperation = await prisma.idempotencyKey.findUnique({
    where: { key }
  })

  if (existingOperation) {
    // Check if it's expired
    const expiryTime = new Date(existingOperation.createdAt.getTime() + (expiryMinutes * 60 * 1000))
    if (new Date() > expiryTime) {
      // Clean up expired key
      await prisma.idempotencyKey.delete({ where: { key } })
      return null
    }
    
    return existingOperation
  }

  return null
}

export async function recordIdempotencyKey(
  options: IdempotencyOptions,
  result: any
) {
  const { key, entityType, userId, operation } = options
  
  await prisma.idempotencyKey.create({
    data: {
      key,
      entityType,
      userId,
      operation,
      result: result ? JSON.stringify(result) : null
    }
  })
}