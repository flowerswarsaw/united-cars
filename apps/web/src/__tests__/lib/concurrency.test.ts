/**
 * Unit tests for concurrency control system
 * Tests optimistic locking, state validation, and idempotency
 */

import {
  performOptimisticUpdate,
  validateStatusTransition,
  STATUS_TRANSITIONS,
  ConcurrencyError
} from '@/lib/concurrency'
import { prisma } from '@united-cars/db'

// Mock Prisma
jest.mock('@united-cars/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    insuranceClaim: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    serviceRequest: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    idempotencyKey: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Concurrency Control System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateStatusTransition', () => {
    it('should allow valid insurance claim state transitions', () => {
      const validTransitions = [
        ['new', 'review'],
        ['review', 'approved'],
        ['review', 'rejected'],
        ['approved', 'paid']
      ]

      validTransitions.forEach(([from, to]) => {
        expect(
          validateStatusTransition({
            from,
            to,
            allowedTransitions: STATUS_TRANSITIONS.insuranceClaim
          })
        ).toBe(true)
      })
    })

    it('should reject invalid insurance claim state transitions', () => {
      const invalidTransitions = [
        ['new', 'approved'],     // Skip review
        ['new', 'paid'],         // Skip multiple steps
        ['rejected', 'approved'], // Can't approve after rejection
        ['paid', 'new']          // Can't go backwards
      ]

      invalidTransitions.forEach(([from, to]) => {
        expect(
          validateStatusTransition({
            from,
            to,
            allowedTransitions: STATUS_TRANSITIONS.insuranceClaim
          })
        ).toBe(false)
      })
    })

    it('should allow valid service request state transitions', () => {
      const validTransitions = [
        ['pending', 'in_progress'],
        ['pending', 'cancelled'],
        ['in_progress', 'completed'],
        ['in_progress', 'cancelled']
      ]

      validTransitions.forEach(([from, to]) => {
        expect(
          validateStatusTransition({
            from,
            to,
            allowedTransitions: STATUS_TRANSITIONS.serviceRequest
          })
        ).toBe(true)
      })
    })

    it('should reject invalid service request state transitions', () => {
      const invalidTransitions = [
        ['pending', 'completed'],    // Skip intermediate step
        ['completed', 'pending'],    // Can't go backwards
        ['cancelled', 'in_progress'] // Can't restart after cancellation
      ]

      invalidTransitions.forEach(([from, to]) => {
        expect(
          validateStatusTransition({
            from,
            to,
            allowedTransitions: STATUS_TRANSITIONS.serviceRequest
          })
        ).toBe(false)
      })
    })

    it('should handle unknown states gracefully', () => {
      expect(
        validateStatusTransition({
          from: 'unknown_state',
          to: 'any_state',
          allowedTransitions: STATUS_TRANSITIONS.insuranceClaim
        })
      ).toBe(false)
    })
  })

  describe('performOptimisticUpdate', () => {
    it('should successfully update when version matches', async () => {
      const mockTx = {
        insuranceClaim: {
          findUnique: jest.fn().mockResolvedValue({ version: 1 }),
          update: jest.fn().mockResolvedValue({
            id: 'claim-123',
            status: 'approved',
            version: 2,
            updatedAt: new Date()
          })
        },
        auditLog: {
          create: jest.fn()
        }
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => callback(mockTx)
      )

      const result = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' }
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe(2)
      }
    })

    it('should fail when version mismatch occurs', async () => {
      const mockTx = {
        insuranceClaim: {
          findUnique: jest.fn().mockResolvedValue({ version: 2 }) // Different version
        }
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => callback(mockTx)
      )

      const result = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('CONCURRENT_MODIFICATION')
        expect(result.error.currentVersion).toBe(2)
        expect(result.error.expectedVersion).toBe(1)
      }
    })

    it('should fail when entity not found', async () => {
      const mockTx = {
        insuranceClaim: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback: any) => callback(mockTx)
      )

      const result = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' }
      })

      expect(result.success).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Connection timeout'))

      const result = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('CONCURRENT_MODIFICATION')
      }
    })

    it('should reject unsupported entity types', async () => {
      const result = await performOptimisticUpdate({
        entityType: 'unknown_entity' as any,
        id: 'id-123',
        expectedVersion: 1,
        updateData: { status: 'approved' }
      })

      expect(result.success).toBe(false)
    })
  })

  describe('STATUS_TRANSITIONS configuration', () => {
    it('should have properly configured state machines', () => {
      expect(STATUS_TRANSITIONS.insuranceClaim).toBeDefined()
      expect(STATUS_TRANSITIONS.serviceRequest).toBeDefined()
      expect(STATUS_TRANSITIONS.paymentIntent).toBeDefined()

      // Verify structure
      const claimStates = STATUS_TRANSITIONS.insuranceClaim
      expect(claimStates.new).toContain('review')
      expect(claimStates.review).toContain('approved')
      expect(claimStates.review).toContain('rejected')
      expect(claimStates.approved).toContain('paid')
    })

    it('should define terminal states correctly', () => {
      // paid and rejected should be terminal states for claims
      expect(STATUS_TRANSITIONS.insuranceClaim.paid).toHaveLength(0)
      expect(STATUS_TRANSITIONS.insuranceClaim.rejected).toHaveLength(0)

      // completed and cancelled should be terminal states for service requests
      expect(STATUS_TRANSITIONS.serviceRequest.completed).toHaveLength(0)
      expect(STATUS_TRANSITIONS.serviceRequest.cancelled).toHaveLength(0)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle concurrent claim approval attempts', async () => {
      const claimId = 'claim-123'
      let currentVersion = 5

      // First call succeeds
      const mockTxSuccess = {
        insuranceClaim: {
          findUnique: jest.fn().mockResolvedValue({ version: currentVersion }),
          update: jest.fn().mockResolvedValue({
            id: claimId,
            status: 'approved',
            version: currentVersion + 1
          })
        },
        auditLog: { create: jest.fn() }
      }

      // Second call sees updated version
      const mockTxFail = {
        insuranceClaim: {
          findUnique: jest.fn().mockResolvedValue({ version: currentVersion + 1 })
        }
      };

      (mockPrisma.$transaction as jest.Mock)
        .mockImplementationOnce(async (callback: any) => callback(mockTxSuccess))
        .mockImplementationOnce(async (callback: any) => callback(mockTxFail))

      // First approval
      const result1 = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: claimId,
        expectedVersion: currentVersion,
        updateData: { status: 'approved', approvedBy: 'user-1' }
      })

      // Second approval (should fail)
      const result2 = await performOptimisticUpdate({
        entityType: 'insurance_claim',
        id: claimId,
        expectedVersion: currentVersion, // Same version as first attempt
        updateData: { status: 'approved', approvedBy: 'user-2' }
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      if (!result2.success) {
        expect(result2.error.code).toBe('CONCURRENT_MODIFICATION')
      }
    })
  })
})
