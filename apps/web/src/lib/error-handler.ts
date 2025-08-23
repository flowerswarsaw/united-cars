/**
 * Comprehensive Error Handling System
 * Provides standardized error responses, logging, and monitoring
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { logger, LogCategory, RequestContext } from './logger'

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN', 
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation & Input
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resources & Data
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // Concurrency & Race Conditions
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  DUPLICATE_OPERATION = 'DUPLICATE_OPERATION',

  // External Services & Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File & Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Database & Infrastructure  
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Error severity levels for monitoring and alerting
 */
export enum ErrorSeverity {
  LOW = 'low',        // Expected errors (validation, not found)
  MEDIUM = 'medium',  // Business logic errors, rate limiting
  HIGH = 'high',      // Infrastructure issues, external service failures
  CRITICAL = 'critical' // Data corruption, security breaches
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  code: ErrorCode
  message: string
  details?: string
  field?: string
  severity: ErrorSeverity
  retryable: boolean
  statusCode: number
}

/**
 * Error context for logging and monitoring
 */
export interface ErrorContext {
  requestId?: string
  userId?: string
  orgId?: string
  endpoint: string
  method: string
  userAgent?: string
  ip?: string
  timestamp: string
}

/**
 * Complete error response structure
 */
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: string
    field?: string
    requestId?: string
    timestamp: string
  }
}

/**
 * Error registry with predefined error configurations
 */
export const ERROR_REGISTRY: Record<ErrorCode, Omit<ErrorInfo, 'details' | 'field'>> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHORIZED,
    message: 'Authentication required',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 401
  },
  [ErrorCode.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: 'Insufficient permissions',
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    statusCode: 403
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    code: ErrorCode.TOKEN_EXPIRED,
    message: 'Authentication token has expired',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 401
  },

  // Validation & Input
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Invalid input parameters',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 400
  },
  [ErrorCode.INVALID_INPUT]: {
    code: ErrorCode.INVALID_INPUT,
    message: 'Invalid input provided',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 400
  },

  // Resources & Data
  [ErrorCode.NOT_FOUND]: {
    code: ErrorCode.NOT_FOUND,
    message: 'Resource not found',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 404
  },
  [ErrorCode.ALREADY_EXISTS]: {
    code: ErrorCode.ALREADY_EXISTS,
    message: 'Resource already exists',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 409
  },
  [ErrorCode.CONFLICT]: {
    code: ErrorCode.CONFLICT,
    message: 'Resource conflict',
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    statusCode: 409
  },

  // Business Logic
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    code: ErrorCode.BUSINESS_RULE_VIOLATION,
    message: 'Business rule violation',
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    statusCode: 400
  },
  [ErrorCode.INVALID_STATE_TRANSITION]: {
    code: ErrorCode.INVALID_STATE_TRANSITION,
    message: 'Invalid state transition',
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    statusCode: 400
  },

  // Concurrency
  [ErrorCode.CONCURRENT_MODIFICATION]: {
    code: ErrorCode.CONCURRENT_MODIFICATION,
    message: 'Resource was modified by another user',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    statusCode: 409
  },

  // Rate Limiting & External Services
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    statusCode: 429
  },

  // File & Upload
  [ErrorCode.FILE_TOO_LARGE]: {
    code: ErrorCode.FILE_TOO_LARGE,
    message: 'File size exceeds maximum limit',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 400
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    code: ErrorCode.INVALID_FILE_TYPE,
    message: 'File type not allowed',
    severity: ErrorSeverity.LOW,
    retryable: false,
    statusCode: 400
  },

  // Infrastructure
  [ErrorCode.DATABASE_ERROR]: {
    code: ErrorCode.DATABASE_ERROR,
    message: 'Database operation failed',
    severity: ErrorSeverity.HIGH,
    retryable: true,
    statusCode: 500
  },
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
    severity: ErrorSeverity.HIGH,
    retryable: true,
    statusCode: 500
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  options: {
    details?: string
    field?: string
    requestId?: string
    customMessage?: string
  } = {}
): NextResponse {
  const errorConfig = ERROR_REGISTRY[code]
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message: options.customMessage || errorConfig.message,
      details: options.details,
      field: options.field,
      requestId: options.requestId,
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json(errorResponse, { status: errorConfig.statusCode })
}

/**
 * Log error with structured context for monitoring
 */
export function logError(
  error: Error | any,
  context: ErrorContext,
  errorInfo?: Partial<ErrorInfo>
) {
  const requestContext = new RequestContext(
    context.requestId || 'unknown',
    context.userId,
    context.orgId,
    context.ip,
    context.userAgent
  )

  const severity = errorInfo?.severity || ErrorSeverity.MEDIUM
  const category = severity === ErrorSeverity.CRITICAL ? LogCategory.SECURITY : LogCategory.API

  // Log with appropriate severity
  if (severity === ErrorSeverity.CRITICAL) {
    logger.critical(
      category,
      error.message || 'Critical system error',
      error,
      requestContext.withContext({
        endpoint: context.endpoint,
        method: context.method,
        errorCode: errorInfo?.code,
        severity
      })
    )
  } else if (severity === ErrorSeverity.HIGH) {
    logger.error(
      category,
      error.message || 'High severity error',
      error,
      requestContext.withContext({
        endpoint: context.endpoint,
        method: context.method,
        errorCode: errorInfo?.code,
        severity
      })
    )
  } else {
    logger.warn(
      category,
      error.message || 'API error occurred',
      requestContext.withContext({
        endpoint: context.endpoint,
        method: context.method,
        errorCode: errorInfo?.code,
        severity,
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })
    )
  }
}

/**
 * Comprehensive error handler for API routes
 */
export function handleError(
  error: any,
  context: ErrorContext,
  requestId?: string
): NextResponse {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    logError(error, context, { code: ErrorCode.VALIDATION_ERROR, severity: ErrorSeverity.LOW })
    
    return createErrorResponse(ErrorCode.VALIDATION_ERROR, { 
      details,
      requestId 
    })
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    logError(error, context, { code: ErrorCode.VALIDATION_ERROR, severity: ErrorSeverity.LOW })
    return createErrorResponse(ErrorCode.VALIDATION_ERROR, { requestId })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        logError(error, context, { code: ErrorCode.ALREADY_EXISTS, severity: ErrorSeverity.LOW })
        return createErrorResponse(ErrorCode.ALREADY_EXISTS, { 
          details: 'A record with this information already exists',
          requestId 
        })
      
      case 'P2025': // Record not found
        logError(error, context, { code: ErrorCode.NOT_FOUND, severity: ErrorSeverity.LOW })
        return createErrorResponse(ErrorCode.NOT_FOUND, { requestId })
      
      case 'P2034': // Transaction failed due to write conflict
        logError(error, context, { code: ErrorCode.CONCURRENT_MODIFICATION, severity: ErrorSeverity.MEDIUM })
        return createErrorResponse(ErrorCode.CONCURRENT_MODIFICATION, { requestId })
      
      default:
        logError(error, context, { code: ErrorCode.DATABASE_ERROR, severity: ErrorSeverity.HIGH })
        return createErrorResponse(ErrorCode.DATABASE_ERROR, { requestId })
    }
  }

  // Handle custom error codes
  if (error.code && ERROR_REGISTRY[error.code as ErrorCode]) {
    const errorCode = error.code as ErrorCode
    logError(error, context, ERROR_REGISTRY[errorCode])
    return createErrorResponse(errorCode, { 
      details: error.details,
      customMessage: error.message,
      requestId 
    })
  }

  // Handle generic errors
  logError(error, context, { code: ErrorCode.INTERNAL_ERROR, severity: ErrorSeverity.HIGH })
  return createErrorResponse(ErrorCode.INTERNAL_ERROR, { requestId })
}

/**
 * Middleware wrapper for consistent error handling and request logging
 */
export function withErrorHandler(
  handler: (req: any, context: any) => Promise<NextResponse>,
  endpointInfo: { path: string; method: string }
) {
  return async (req: any, context: any) => {
    const requestId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    const errorContext: ErrorContext = {
      requestId,
      endpoint: endpointInfo.path,
      method: endpointInfo.method,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      timestamp: new Date().toISOString()
    }

    const requestContext = new RequestContext(
      requestId,
      undefined, // userId will be set after authentication
      undefined, // orgId will be set after authentication  
      errorContext.ip,
      errorContext.userAgent
    )

    // Log request start
    logger.api(
      requestContext.withContext({
        method: endpointInfo.method,
        endpoint: endpointInfo.path,
        message: `${endpointInfo.method} ${endpointInfo.path} - Request started`
      })
    )

    try {
      const response = await handler(req, context)
      const responseTime = Date.now() - startTime
      const statusCode = response.status || 200

      // Log successful request completion
      logger.api(
        requestContext.withContext({
          method: endpointInfo.method,
          endpoint: endpointInfo.path,
          statusCode,
          responseTime,
          message: `${endpointInfo.method} ${endpointInfo.path} - ${statusCode} (${responseTime}ms)`
        })
      )

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Update error context with user info if available in the error
      if (error.userId) errorContext.userId = error.userId
      if (error.orgId) errorContext.orgId = error.orgId

      const errorResponse = handleError(error, errorContext, requestId)
      
      // Log error completion with timing
      logger.api(
        requestContext.withContext({
          method: endpointInfo.method,
          endpoint: endpointInfo.path,
          statusCode: errorResponse.status || 500,
          responseTime,
          message: `${endpointInfo.method} ${endpointInfo.path} - Error ${errorResponse.status || 500} (${responseTime}ms)`,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        })
      )

      return errorResponse
    }
  }
}

/**
 * Custom error classes for business logic
 */
export class BusinessError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: string,
    public field?: string
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, field?: string, details?: string) {
    super(ErrorCode.VALIDATION_ERROR, message, details, field)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string, details?: string) {
    super(ErrorCode.CONFLICT, message, details)
    this.name = 'ConflictError'
  }
}

/**
 * Error monitoring helpers
 */
export function createErrorMetrics() {
  // TODO: Implement error metrics collection
  return {
    incrementErrorCount: (code: ErrorCode, endpoint: string) => {
      // Increment metrics counter
    },
    recordErrorDuration: (duration: number) => {
      // Record error processing time
    }
  }
}