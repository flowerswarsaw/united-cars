/**
 * Unit tests for error handler system
 * Tests standardized error responses, logging, and error categorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ErrorCode,
  ErrorSeverity,
  createErrorResponse,
  handleError,
  withErrorHandler,
  logError,
  BusinessError,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'

// Mock logger to verify logging calls
jest.mock('@/lib/logger', () => ({
  logger: {
    critical: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    api: jest.fn(),
    business: jest.fn(),
  },
  LogCategory: {
    API: 'api',
    AUTH: 'auth', 
    SECURITY: 'security',
    BUSINESS: 'business'
  },
  RequestContext: jest.fn().mockImplementation((requestId, userId, orgId, ip, userAgent) => ({
    requestId,
    userId,
    orgId,
    ip,
    userAgent,
    withContext: (data: any) => ({ ...data, requestId, userId, orgId, ip, userAgent })
  }))
}))

const { logger, RequestContext } = require('@/lib/logger')

describe('Error Handler System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createErrorResponse', () => {
    it('should create standardized error response for UNAUTHORIZED', () => {
      const response = createErrorResponse(ErrorCode.UNAUTHORIZED)
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(401)
      
      // Parse response body to verify structure
      const responseData = JSON.parse(response.body as any)
      expect(responseData).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: expect.any(String)
        }
      })
    })

    it('should create error response with custom details', () => {
      const response = createErrorResponse(ErrorCode.VALIDATION_ERROR, {
        details: 'Email is required',
        field: 'email',
        requestId: 'test-req-123'
      })
      
      expect(response.status).toBe(400)
      const responseData = JSON.parse(response.body as any)
      expect(responseData.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters',
        details: 'Email is required',
        field: 'email',
        requestId: 'test-req-123'
      })
    })

    it('should create error response with custom message', () => {
      const customMessage = 'This specific operation is not allowed'
      const response = createErrorResponse(ErrorCode.FORBIDDEN, {
        customMessage
      })
      
      const responseData = JSON.parse(response.body as any)
      expect(responseData.error.message).toBe(customMessage)
    })
  })

  describe('Custom Error Classes', () => {
    it('should create BusinessError with correct properties', () => {
      const error = new BusinessError(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Cannot approve claim in current state',
        'Claim must be in review status',
        'status'
      )
      
      expect(error.name).toBe('BusinessError')
      expect(error.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION)
      expect(error.message).toBe('Cannot approve claim in current state')
      expect(error.details).toBe('Claim must be in review status')
      expect(error.field).toBe('status')
    })

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid VIN format', 'vin', 'VIN must be 17 characters')
      
      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.field).toBe('vin')
      expect(error.details).toBe('VIN must be 17 characters')
    })

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Vehicle')
      
      expect(error.name).toBe('NotFoundError')
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.message).toBe('Vehicle not found')
    })
  })

  describe('handleError', () => {
    const mockContext = {
      requestId: 'test-req-123',
      endpoint: '/api/test',
      method: 'POST',
      ip: '192.168.1.1',
      timestamp: '2024-01-01T00:00:00.000Z'
    }

    it('should handle Zod validation errors', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number'
        }
      ])

      const response = handleError(zodError, mockContext, 'test-req-123')
      
      expect(response.status).toBe(400)
      const responseData = JSON.parse(response.body as any)
      expect(responseData.error.code).toBe('VALIDATION_ERROR')
      expect(responseData.error.details).toContain('email: Expected string, received number')
    })

    it('should handle custom business errors', () => {
      const businessError = new BusinessError(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Invalid state transition',
        'Cannot change from new to completed'
      )

      const response = handleError(businessError, mockContext, 'test-req-123')
      
      expect(response.status).toBe(400)
      const responseData = JSON.parse(response.body as any)
      expect(responseData.error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(responseData.error.message).toBe('Invalid state transition')
    })

    it('should handle generic errors as internal errors', () => {
      const genericError = new Error('Something went wrong')

      const response = handleError(genericError, mockContext, 'test-req-123')
      
      expect(response.status).toBe(500)
      const responseData = JSON.parse(response.body as any)
      expect(responseData.error.code).toBe('INTERNAL_ERROR')
      expect(responseData.error.message).toBe('Internal server error')
    })

    it('should log errors with appropriate severity', () => {
      const criticalError = new Error('Database connection failed')
      criticalError.code = ErrorCode.DATABASE_ERROR

      handleError(criticalError, mockContext, 'test-req-123')

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'High severity error',
        criticalError,
        expect.objectContaining({
          endpoint: '/api/test',
          method: 'POST',
          requestId: 'test-req-123'
        })
      )
    })
  })

  describe('withErrorHandler', () => {
    it('should handle successful requests', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true, data: 'test' })
      )

      const wrappedHandler = withErrorHandler(mockHandler, {
        path: '/api/test',
        method: 'GET'
      })

      const mockRequest = {
        headers: new Map([
          ['user-agent', 'test-agent'],
          ['x-forwarded-for', '192.168.1.1']
        ])
      } as any

      const response = await wrappedHandler(mockRequest, {})

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, {})
      expect(response).toBeInstanceOf(NextResponse)
      expect(logger.api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          endpoint: '/api/test',
          message: 'GET /api/test - Request started'
        })
      )
    })

    it('should handle thrown errors and log them', async () => {
      const testError = new ValidationError('Invalid input', 'email')
      const mockHandler = jest.fn().mockRejectedValue(testError)

      const wrappedHandler = withErrorHandler(mockHandler, {
        path: '/api/test',
        method: 'POST'
      })

      const mockRequest = {
        headers: new Map([['x-request-id', 'test-123']])
      } as any

      const response = await wrappedHandler(mockRequest, {})

      expect(response.status).toBe(400)
      expect(logger.api).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          endpoint: '/api/test',
          statusCode: 400,
          message: expect.stringContaining('Error 400')
        })
      )
    })

    it('should generate request ID if not provided', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const wrappedHandler = withErrorHandler(mockHandler, {
        path: '/api/test',
        method: 'GET'
      })

      const mockRequest = {
        headers: new Map()
      } as any

      await wrappedHandler(mockRequest, {})

      expect(logger.api).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/)
        })
      )
    })

    it('should measure and log response times', async () => {
      const mockHandler = jest.fn().mockImplementation(async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50))
        return NextResponse.json({ success: true })
      })

      const wrappedHandler = withErrorHandler(mockHandler, {
        path: '/api/test',
        method: 'GET'
      })

      const mockRequest = {
        headers: new Map()
      } as any

      await wrappedHandler(mockRequest, {})

      expect(logger.api).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: expect.any(Number),
          message: expect.stringContaining('ms)')
        })
      )
    })
  })

  describe('logError', () => {
    const mockContext = {
      requestId: 'test-123',
      userId: 'user-456',
      orgId: 'org-789',
      endpoint: '/api/test',
      method: 'POST',
      ip: '192.168.1.1',
      userAgent: 'test-agent',
      timestamp: '2024-01-01T00:00:00.000Z'
    }

    it('should log critical errors to security category', () => {
      const error = new Error('Critical system failure')
      const errorInfo = {
        code: ErrorCode.DATABASE_ERROR,
        severity: ErrorSeverity.CRITICAL
      }

      logError(error, mockContext, errorInfo)

      expect(logger.critical).toHaveBeenCalledWith(
        'security',
        'Critical system error',
        error,
        expect.objectContaining({
          requestId: 'test-123',
          userId: 'user-456',
          endpoint: '/api/test'
        })
      )
    })

    it('should log high severity errors', () => {
      const error = new Error('Database query failed')
      const errorInfo = {
        code: ErrorCode.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH
      }

      logError(error, mockContext, errorInfo)

      expect(logger.error).toHaveBeenCalledWith(
        'api',
        'High severity error',
        error,
        expect.objectContaining({
          errorCode: ErrorCode.DATABASE_ERROR,
          severity: ErrorSeverity.HIGH
        })
      )
    })

    it('should log low/medium severity as warnings', () => {
      const error = new Error('Validation failed')
      const errorInfo = {
        code: ErrorCode.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW
      }

      logError(error, mockContext, errorInfo)

      expect(logger.warn).toHaveBeenCalledWith(
        'api',
        'API error occurred',
        expect.objectContaining({
          requestId: 'test-123',
          error: {
            name: error.name,
            message: error.message,
            stack: undefined // Should not include stack in production
          }
        })
      )
    })

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      logError(error, mockContext)

      expect(logger.warn).toHaveBeenCalledWith(
        'api',
        'API error occurred',
        expect.objectContaining({
          error: {
            name: error.name,
            message: error.message,
            stack: expect.any(String)
          }
        })
      )

      process.env.NODE_ENV = originalEnv
    })
  })
})