/**
 * Unit tests for concurrency control system
 * Tests optimistic locking, state validation, and idempotency
 */

import {
  performOptimisticUpdate,
  validateStateTransition,
  generateIdempotencyKey,
  ConcurrencyError,
  VALID_STATE_MACHINES
} from '@/lib/concurrency'
import { prisma } from '@united-cars/db'

// Mock Prisma
jest.mock('@united-cars/db')
const mockPrisma = prisma as any

describe('Concurrency Control System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('performOptimisticUpdate', () => {
    it('should successfully update when version matches', async () => {
      const mockData = {
        id: 'claim-123',
        status: 'approved',
        version: 1
      }

      mockPrisma.insuranceClaim.update.mockResolvedValue({
        ...mockData,
        version: 2,
        updatedAt: new Date()
      })

      const result = await performOptimisticUpdate({
        model: mockPrisma.insuranceClaim,
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' },
        operation: 'approve_claim'
      })

      expect(result.success).toBe(true)
      expect(result.data.version).toBe(2)
      expect(mockPrisma.insuranceClaim.update).toHaveBeenCalledWith({
        where: {
          id: 'claim-123',
          version: 1
        },
        data: {
          status: 'approved',
          version: { increment: 1 }
        }
      })
    })

    it('should fail when version mismatch occurs', async () => {
      const versionMismatchError = new Error('Record not found')
      versionMismatchError.code = 'P2025'
      mockPrisma.insuranceClaim.update.mockRejectedValue(versionMismatchError)

      const result = await performOptimisticUpdate({
        model: mockPrisma.insuranceClaim,
        id: 'claim-123',
        expectedVersion: 1,
        updateData: { status: 'approved' },
        operation: 'approve_claim'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ConcurrencyError)
      expect(result.error.type).toBe('version_mismatch')
      expect(result.error.message).toContain('concurrent modification')
    })

    it('should handle unique constraint violations', async () => {
      const uniqueConstraintError = new Error('Unique constraint failed')
      uniqueConstraintError.code = 'P2002'
      mockPrisma.vehicle.update.mockRejectedValue(uniqueConstraintError)

      const result = await performOptimisticUpdate({
        model: mockPrisma.vehicle,
        id: 'vehicle-123',
        expectedVersion: 3,
        updateData: { vin: 'DUPLICATE123456789' },
        operation: 'update_vin'
      })

      expect(result.success).toBe(false)
      expect(result.error.type).toBe('constraint_violation')
      expect(result.error.message).toContain('constraint violation')
    })

    it('should handle general database errors', async () => {
      const dbError = new Error('Connection timeout')
      mockPrisma.serviceRequest.update.mockRejectedValue(dbError)

      const result = await performOptimisticUpdate({
        model: mockPrisma.serviceRequest,
        id: 'service-123',
        expectedVersion: 0,
        updateData: { status: 'in_progress' },
        operation: 'start_service'
      })

      expect(result.success).toBe(false)
      expect(result.error.type).toBe('database_error')
    })

    it('should include operation context in error messages', async () => {
      const error = new Error('Database error')
      mockPrisma.title.update.mockRejectedValue(error)

      const result = await performOptimisticUpdate({
        model: mockPrisma.title,
        id: 'title-123',
        expectedVersion: 2,
        updateData: { status: 'processed' },
        operation: 'process_title_document'
      })

      expect(result.success).toBe(false)
      expect(result.error.operation).toBe('process_title_document')
      expect(result.error.entityId).toBe('title-123')
    })
  })

  describe('validateStateTransition', () => {
    it('should allow valid insurance claim state transitions', () => {
      const validTransitions = [
        ['new', 'review'],
        ['review', 'approved'],
        ['review', 'rejected'],
        ['approved', 'paid']
      ]

      validTransitions.forEach(([from, to]) => {
        expect(
          validateStateTransition('insuranceClaim', from, to)
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
          validateStateTransition('insuranceClaim', from, to)
        ).toBe(false)
      })
    })

    it('should allow valid service request state transitions', () => {
      const validTransitions = [
        ['pending', 'approved'],
        ['approved', 'in_progress'],
        ['in_progress', 'completed'],
        ['pending', 'rejected']
      ]

      validTransitions.forEach(([from, to]) => {
        expect(
          validateStateTransition('serviceRequest', from, to)
        ).toBe(true)
      })
    })

    it('should reject invalid service request state transitions', () => {
      const invalidTransitions = [
        ['pending', 'completed'],    // Skip intermediate steps
        ['rejected', 'in_progress'], // Can't start after rejection
        ['completed', 'pending']     // Can't go backwards
      ]

      invalidTransitions.forEach(([from, to]) => {
        expect(
          validateStateTransition('serviceRequest', from, to)
        ).toBe(false)
      })
    })

    it('should allow valid title state transitions', () => {
      const validTransitions = [
        ['pending', 'processing'],
        ['processing', 'completed'],
        ['processing', 'on_hold'],
        ['on_hold', 'processing']
      ]

      validTransitions.forEach(([from, to]) => {
        expect(
          validateStateTransition('title', from, to)
        ).toBe(true)
      })
    })

    it('should handle unknown entity types', () => {
      expect(
        validateStateTransition('unknownEntity' as any, 'any', 'state')
      ).toBe(true) // Should allow unknown entities to avoid breaking changes
    })

    it('should handle case sensitivity', () => {
      expect(
        validateStateTransition('insuranceClaim', 'NEW', 'REVIEW')
      ).toBe(false) // Should be case sensitive
    })
  })

  describe('generateIdempotencyKey', () => {
    it('should generate consistent keys for same inputs', () => {
      const key1 = generateIdempotencyKey('create_claim', 'user-123', {
        vehicleId: 'vehicle-456',
        description: 'Test claim'
      })

      const key2 = generateIdempotencyKey('create_claim', 'user-123', {
        vehicleId: 'vehicle-456',
        description: 'Test claim'
      })

      expect(key1).toBe(key2)
      expect(key1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
    })

    it('should generate different keys for different operations', () => {
      const commonParams = { vehicleId: 'vehicle-123' }

      const key1 = generateIdempotencyKey('create_claim', 'user-123', commonParams)
      const key2 = generateIdempotencyKey('update_claim', 'user-123', commonParams)

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different users', () => {
      const commonParams = { vehicleId: 'vehicle-123' }

      const key1 = generateIdempotencyKey('create_claim', 'user-123', commonParams)
      const key2 = generateIdempotencyKey('create_claim', 'user-456', commonParams)

      expect(key1).not.toBe(key2)
    })

    it('should generate different keys for different parameters', () => {
      const key1 = generateIdempotencyKey('create_claim', 'user-123', {
        vehicleId: 'vehicle-123',
        amount: 1000
      })

      const key2 = generateIdempotencyKey('create_claim', 'user-123', {
        vehicleId: 'vehicle-123',
        amount: 2000
      })

      expect(key1).not.toBe(key2)
    })

    it('should handle complex nested objects', () => {
      const complexParams = {
        vehicle: {
          id: 'vehicle-123',
          details: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020
          }
        },
        damage: {
          type: 'collision',
          severity: 'major',
          photos: ['photo1.jpg', 'photo2.jpg']
        }
      }

      const key = generateIdempotencyKey('create_claim', 'user-123', complexParams)

      expect(key).toMatch(/^[a-f0-9]{64}$/)
      expect(key).toBeTruthy()
    })

    it('should handle undefined and null values consistently', () => {
      const key1 = generateIdempotencyKey('test_op', 'user-123', {
        field1: null,
        field2: undefined
      })

      const key2 = generateIdempotencyKey('test_op', 'user-123', {
        field1: null,
        field2: undefined
      })

      expect(key1).toBe(key2)
    })
  })

  describe('ConcurrencyError', () => {
    it('should create version mismatch error with correct properties', () => {
      const error = new ConcurrencyError(
        'version_mismatch',
        'Entity was modified by another user',
        'update_claim',
        'claim-123'
      )

      expect(error.name).toBe('ConcurrencyError')
      expect(error.type).toBe('version_mismatch')
      expect(error.message).toBe('Entity was modified by another user')
      expect(error.operation).toBe('update_claim')
      expect(error.entityId).toBe('claim-123')
      expect(error.retryable).toBe(true) // Version mismatch is retryable
    })

    it('should create constraint violation error', () => {
      const error = new ConcurrencyError(
        'constraint_violation',
        'Unique constraint failed',
        'create_vehicle',
        'vehicle-123'
      )

      expect(error.type).toBe('constraint_violation')
      expect(error.retryable).toBe(false) // Constraint violations are not retryable
    })

    it('should create database error', () => {
      const error = new ConcurrencyError(
        'database_error',
        'Connection timeout',
        'update_status',
        'entity-123'
      )

      expect(error.type).toBe('database_error')
      expect(error.retryable).toBe(true) // Database errors are retryable
    })

    it('should include timestamp', () => {
      const error = new ConcurrencyError('version_mismatch', 'Test error')

      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.timestamp.getTime()).toBeCloseTo(Date.now(), -2) // Within ~100ms
    })
  })

  describe('Integration scenarios', () => {
    it('should handle concurrent claim approval attempts', async () => {
      // Simulate two users trying to approve the same claim
      const claimId = 'claim-123'
      const currentVersion = 5

      // First update succeeds
      mockPrisma.insuranceClaim.update
        .mockResolvedValueOnce({
          id: claimId,
          status: 'approved',
          version: currentVersion + 1
        })
        // Second update fails with version mismatch
        .mockRejectedValueOnce(Object.assign(new Error('Not found'), { code: 'P2025' }))

      // First approval
      const result1 = await performOptimisticUpdate({
        model: mockPrisma.insuranceClaim,
        id: claimId,
        expectedVersion: currentVersion,
        updateData: { status: 'approved', approvedBy: 'user-1' },
        operation: 'approve_claim'
      })

      // Second approval (should fail)
      const result2 = await performOptimisticUpdate({
        model: mockPrisma.insuranceClaim,
        id: claimId,
        expectedVersion: currentVersion, // Same version as first attempt
        updateData: { status: 'approved', approvedBy: 'user-2' },
        operation: 'approve_claim'
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      expect(result2.error.type).toBe('version_mismatch')
    })

    it('should validate state transitions during optimistic updates', () => {
      // Valid transition
      expect(validateStateTransition('insuranceClaim', 'review', 'approved')).toBe(true)
      
      // Invalid transition
      expect(validateStateTransition('insuranceClaim', 'new', 'paid')).toBe(false)
    })

    it('should generate stable idempotency keys for retry scenarios', () => {
      const operation = 'create_service_request'
      const userId = 'user-456' 
      const params = {
        vehicleId: 'vehicle-789',
        serviceType: 'inspection',
        requestedAt: '2024-01-15T10:00:00Z'
      }

      // Same request parameters should generate same key
      const key1 = generateIdempotencyKey(operation, userId, params)
      const key2 = generateIdempotencyKey(operation, userId, params)
      const key3 = generateIdempotencyKey(operation, userId, params)

      expect(key1).toBe(key2)
      expect(key2).toBe(key3)

      // Different timestamp should generate different key
      const differentParams = { ...params, requestedAt: '2024-01-15T11:00:00Z' }
      const differentKey = generateIdempotencyKey(operation, userId, differentParams)
      
      expect(differentKey).not.toBe(key1)
    })
  })

  describe('State machine configuration', () => {
    it('should have properly configured state machines', () => {
      expect(VALID_STATE_MACHINES.insuranceClaim).toBeDefined()
      expect(VALID_STATE_MACHINES.serviceRequest).toBeDefined()
      expect(VALID_STATE_MACHINES.title).toBeDefined()

      // Verify structure
      const claimStates = VALID_STATE_MACHINES.insuranceClaim
      expect(claimStates.new).toContain('review')
      expect(claimStates.review).toContain('approved')
      expect(claimStates.review).toContain('rejected')
      expect(claimStates.approved).toContain('paid')
    })

    it('should not allow circular dependencies', () => {
      // Verify that no state can transition back to a previous state
      // (except for specific allowed cases like on_hold -> processing)
      const claimStates = VALID_STATE_MACHINES.insuranceClaim
      
      // paid should not transition back to any other state
      expect(claimStates.paid || []).toHaveLength(0)
      
      // rejected should not transition back to any other state
      expect(claimStates.rejected || []).toHaveLength(0)
    })
  })
})