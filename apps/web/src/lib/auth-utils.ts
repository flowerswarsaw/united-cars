import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  AuthSessionUser, 
  AuthSession, 
  AuthApiError,
  isValidSessionUser,
  hasRole,
  isAdmin,
  canAccessOrg,
  buildOrgWhereClause,
  createRateLimitId,
  Role
} from '@united-cars/core'
import { logger, LogCategory, RequestContext, LogUtils } from './logger'

// Legacy interface for backward compatibility
interface User extends AuthSessionUser {}

interface Session extends AuthSession {}

export async function getSession(request: NextRequest): Promise<Session | null> {
  const requestContext = new RequestContext(
    request.headers.get('x-request-id') || 'unknown',
    undefined,
    undefined,
    request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    request.headers.get('user-agent') || undefined
  )

  try {
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie?.value) {
      // In development mode, provide a mock admin user
      if (process.env.NODE_ENV === 'development') {
        const mockAdminUser = {
          id: 'admin-dev-user',
          email: 'admin@unitedcars.com',
          name: 'Development Admin',
          orgId: 'united-cars',
          orgName: 'United Cars Admin',
          orgType: 'ADMIN',
          roles: ['ADMIN', 'SUPER_ADMIN', 'USER']
        }
        
        // Update request context with mock user info
        requestContext.userId = mockAdminUser.id
        requestContext.orgId = mockAdminUser.orgId
        
        return { user: mockAdminUser }
      }
      
      // Log authentication attempt without session
      LogUtils.securityEvent(
        'unauthorized_access',
        'low',
        { reason: 'No session cookie provided' },
        requestContext
      )
      return null
    }
    
    const decodedSession = decodeURIComponent(sessionCookie.value)
    const sessionData = JSON.parse(decodedSession)
    
    // Use centralized validation
    if (sessionData.user && isValidSessionUser(sessionData.user)) {
      // Update request context with authenticated user info
      requestContext.userId = sessionData.user.id
      requestContext.orgId = sessionData.user.orgId

      // Log successful authentication
      LogUtils.authSuccess('login', sessionData.user.email, requestContext)
      
      return { user: sessionData.user }
    }
    
    // Log invalid session data
    LogUtils.authFailure('login', 'unknown', 'Invalid session data', requestContext)
    return null
  } catch (error) {
    // Log session parsing errors as security events
    LogUtils.securityEvent(
      'suspicious_activity',
      'medium',
      { 
        reason: 'Session parsing error',
        error: error.message,
        sessionCookiePresent: !!request.cookies.get('session')
      },
      requestContext
    )
    
    logger.warn(
      LogCategory.AUTH,
      'Session parsing error',
      requestContext.withContext({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    )
    
    return null
  }
}

interface AuthOptions {
  requiredRoles?: Role[]
  requireOwnership?: boolean
  ownershipCheck?: (user: User, request: NextRequest) => Promise<boolean>
}

export function requireAuth(options: AuthOptions = {}) {
  return async function (
    request: NextRequest,
    handler: (request: NextRequest, user: User) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const requestContext = new RequestContext(
      request.headers.get('x-request-id') || 'unknown',
      undefined,
      undefined,
      request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      request.headers.get('user-agent') || undefined
    )

    try {
      const session = await getSession(request)
      
      if (!session?.user) {
        LogUtils.securityEvent(
          'unauthorized_access',
          'medium',
          { 
            reason: 'No authentication provided',
            endpoint: request.url,
            requiredRoles: options.requiredRoles
          },
          requestContext
        )
        return createStandardErrorResponse('UNAUTHORIZED', 'Authentication required', 401)
      }

      const { user } = session
      const { requiredRoles, requireOwnership, ownershipCheck } = options

      // Update context with user info
      requestContext.userId = user.id
      requestContext.orgId = user.orgId

      // Check required roles using centralized logic
      if (requiredRoles && requiredRoles.length > 0) {
        if (!hasRole(user, requiredRoles)) {
          LogUtils.securityEvent(
            'unauthorized_access',
            'medium',
            { 
              reason: 'Insufficient role permissions',
              userId: user.id,
              userRoles: user.roles,
              requiredRoles,
              endpoint: request.url
            },
            requestContext
          )
          return createStandardErrorResponse('FORBIDDEN', 'Insufficient permissions', 403)
        }
      }

      // Check ownership
      if (requireOwnership && ownershipCheck) {
        const hasOwnership = await ownershipCheck(user, request)
        if (!hasOwnership) {
          LogUtils.securityEvent(
            'unauthorized_access',
            'high',
            { 
              reason: 'Ownership check failed',
              userId: user.id,
              endpoint: request.url,
              resourceAccess: 'denied'
            },
            requestContext
          )
          return createStandardErrorResponse('FORBIDDEN', 'Access denied', 403)
        }
      }

      // Log successful authorization
      logger.info(
        LogCategory.AUTH,
        'Authorization successful',
        requestContext.withContext({
          userId: user.id,
          userRoles: user.roles,
          endpoint: request.url
        })
      )

      return handler(request, user)
    } catch (error) {
      logger.error(
        LogCategory.AUTH,
        'Auth middleware error',
        error,
        requestContext.withContext({
          endpoint: request.url,
          requiredRoles: options.requiredRoles
        })
      )
      return createStandardErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
    }
  }
}

// Helper for checking org ownership - enhanced with centralized logic
export function checkOrgOwnership(resourceOrgId: string, user: User): boolean {
  return canAccessOrg(user, resourceOrgId)
}

// Predefined auth configurations
export const adminOnly = requireAuth({ requiredRoles: ['ADMIN'] })
export const adminOrOps = requireAuth({ requiredRoles: ['ADMIN', 'OPS'] })
export const dealerOrAdmin = requireAuth({ requiredRoles: ['DEALER', 'ADMIN'] })

// Standardized error response with structured format
export function createStandardErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: string
): NextResponse {
  const error: AuthApiError = { code, message, details }
  return NextResponse.json({ error }, { status })
}

// Enhanced API response helpers
export function createApiResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    ...data,
    ...(message && { message })
  })
}

export function createErrorResponse(error: string, status: number = 400) {
  return createStandardErrorResponse('API_ERROR', error, status)
}

// Validation helpers
export function validatePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '25')))
  return { page, perPage }
}

export function validateIdParam(params: any): string {
  if (!params?.id || typeof params.id !== 'string') {
    throw new Error('Invalid ID parameter')
  }
  return params.id
}

// Safe error handler for API routes
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof z.ZodError) {
    return createStandardErrorResponse(
      'VALIDATION_ERROR',
      'Invalid input parameters',
      400,
      error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    )
  }
  
  if (error.name === 'PrismaClientValidationError') {
    return createStandardErrorResponse('DATABASE_ERROR', 'Invalid database query', 400)
  }
  
  return createStandardErrorResponse('INTERNAL_ERROR', 'Internal server error', 500)
}

// Re-export core utilities for convenience
export { 
  hasRole, 
  isAdmin, 
  canAccessOrg, 
  buildOrgWhereClause, 
  createRateLimitId,
  isValidSessionUser 
}
export type { AuthSessionUser, AuthSession, AuthApiError, Role }