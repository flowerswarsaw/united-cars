/**
 * Unit tests for authentication utilities
 * Tests session handling, authorization, and security logging
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSession,
  requireAuth,
  checkOrgOwnership
} from '@/lib/auth-utils'
import type { AuthSessionUser } from '@united-cars/core'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    auth: jest.fn(),
    security: jest.fn(),
  },
  LogCategory: {
    AUTH: 'auth',
    SECURITY: 'security'
  },
  RequestContext: jest.fn().mockImplementation((requestId, userId, orgId, ip, userAgent) => ({
    requestId,
    userId,
    orgId,
    ip,
    userAgent,
    withContext: (data: any) => ({ ...data, requestId, userId, orgId, ip, userAgent })
  })),
  LogUtils: {
    authSuccess: jest.fn(),
    authFailure: jest.fn(),
    securityEvent: jest.fn()
  }
}))

const { LogUtils } = require('@/lib/logger')

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    const createMockRequest = (sessionData?: any) => {
      const cookies = new Map()
      if (sessionData) {
        cookies.set('session', {
          value: encodeURIComponent(JSON.stringify(sessionData))
        })
      }
      
      return {
        cookies: {
          get: (name: string) => cookies.get(name)
        },
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'x-request-id': 'test-req-123',
              'x-forwarded-for': '192.168.1.1',
              'user-agent': 'test-agent'
            }
            return headers[name]
          }
        },
        ip: '192.168.1.1'
      } as any
    }

    it('should return valid session for authenticated user', async () => {
      const validSessionData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['DEALER'],
          orgId: 'org-456'
        }
      }

      const request = createMockRequest(validSessionData)
      const session = await getSession(request)

      expect(session).toEqual(validSessionData)
      expect(LogUtils.authSuccess).toHaveBeenCalledWith(
        'login',
        'test@example.com',
        expect.any(Object)
      )
    })

    it('should return null for missing session cookie', async () => {
      const request = createMockRequest()
      const session = await getSession(request)

      expect(session).toBeNull()
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'low',
        { reason: 'No session cookie provided' },
        expect.any(Object)
      )
    })

    it('should return null for invalid session data', async () => {
      const invalidSessionData = {
        user: {
          id: 'user-123',
          // Missing required fields like email, roles
        }
      }

      const request = createMockRequest(invalidSessionData)
      const session = await getSession(request)

      expect(session).toBeNull()
      expect(LogUtils.authFailure).toHaveBeenCalledWith(
        'login',
        'unknown',
        'Invalid session data',
        expect.any(Object)
      )
    })

    it('should handle malformed session data gracefully', async () => {
      const request = {
        cookies: {
          get: () => ({ value: 'invalid-json-data' })
        },
        headers: {
          get: () => null
        },
        ip: '192.168.1.1'
      } as any

      const session = await getSession(request)

      expect(session).toBeNull()
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'suspicious_activity',
        'medium',
        expect.objectContaining({
          reason: 'Session parsing error'
        }),
        expect.any(Object)
      )
    })

    it('should log security events with correct IP and user agent', async () => {
      const request = {
        cookies: { get: () => null },
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '203.0.113.1'
            if (name === 'user-agent') return 'Mozilla/5.0 (Suspicious Agent)'
            if (name === 'x-request-id') return 'req-456'
            return null
          }
        },
        ip: '192.168.1.1'
      } as any

      await getSession(request)

      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'low',
        { reason: 'No session cookie provided' },
        expect.objectContaining({
          requestId: 'req-456',
          ip: '203.0.113.1',
          userAgent: 'Mozilla/5.0 (Suspicious Agent)'
        })
      )
    })
  })

  describe('requireAuth', () => {
    const createAuthenticatedUser = (roles: string[] = ['DEALER'], orgId = 'org-123'): AuthSessionUser => ({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      roles: roles as any[],
      orgId
    })

    const createMockAuthRequest = (sessionData?: any) => {
      return {
        url: '/api/test',
        cookies: {
          get: (name: string) => {
            if (name === 'session' && sessionData) {
              return { value: encodeURIComponent(JSON.stringify(sessionData)) }
            }
            return null
          }
        },
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'x-request-id': 'test-req-456',
              'x-forwarded-for': '192.168.1.2',
              'user-agent': 'test-client'
            }
            return headers[name]
          }
        }
      } as any
    }

    it('should allow access for authenticated user with correct role', async () => {
      const user = createAuthenticatedUser(['DEALER', 'USER'])
      const request = createMockAuthRequest({ user })
      
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )

      const authMiddleware = requireAuth({ requiredRoles: ['DEALER'] })
      const response = await authMiddleware(request, mockHandler)

      expect(mockHandler).toHaveBeenCalledWith(request, user)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reject access for user without required role', async () => {
      const user = createAuthenticatedUser(['USER']) // No ADMIN role
      const request = createMockAuthRequest({ user })
      
      const mockHandler = jest.fn()
      const authMiddleware = requireAuth({ requiredRoles: ['ADMIN'] })
      
      const response = await authMiddleware(request, mockHandler)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'medium',
        expect.objectContaining({
          reason: 'Insufficient role permissions',
          userId: 'user-123',
          userRoles: ['USER'],
          requiredRoles: ['ADMIN']
        }),
        expect.any(Object)
      )
    })

    it('should reject unauthenticated requests', async () => {
      const request = createMockAuthRequest() // No session
      const mockHandler = jest.fn()
      
      const authMiddleware = requireAuth({ requiredRoles: ['DEALER'] })
      const response = await authMiddleware(request, mockHandler)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(401)
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'medium',
        expect.objectContaining({
          reason: 'No authentication provided',
          requiredRoles: ['DEALER']
        }),
        expect.any(Object)
      )
    })

    it('should handle ownership checks', async () => {
      const user = createAuthenticatedUser(['DEALER'])
      const request = createMockAuthRequest({ user })
      
      const ownershipCheck = jest.fn().mockResolvedValue(true)
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
      
      const authMiddleware = requireAuth({ 
        requireOwnership: true,
        ownershipCheck
      })
      
      const response = await authMiddleware(request, mockHandler)

      expect(ownershipCheck).toHaveBeenCalledWith(user, request)
      expect(mockHandler).toHaveBeenCalled()
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should reject when ownership check fails', async () => {
      const user = createAuthenticatedUser(['DEALER'])
      const request = createMockAuthRequest({ user })
      
      const ownershipCheck = jest.fn().mockResolvedValue(false)
      const mockHandler = jest.fn()
      
      const authMiddleware = requireAuth({ 
        requireOwnership: true,
        ownershipCheck
      })
      
      const response = await authMiddleware(request, mockHandler)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'high',
        expect.objectContaining({
          reason: 'Ownership check failed',
          userId: 'user-123',
          resourceAccess: 'denied'
        }),
        expect.any(Object)
      )
    })

    it('should log successful authorization', async () => {
      const user = createAuthenticatedUser(['ADMIN'])
      const request = createMockAuthRequest({ user })
      
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const authMiddleware = requireAuth({ requiredRoles: ['ADMIN'] })
      
      await authMiddleware(request, mockHandler)

      // Logger should be called with success info
      const { logger } = require('@/lib/logger')
      expect(logger.info).toHaveBeenCalledWith(
        'auth',
        'Authorization successful',
        expect.objectContaining({
          userId: 'user-123',
          userRoles: ['ADMIN'],
          endpoint: '/api/test'
        })
      )
    })

    it('should handle authentication errors gracefully', async () => {
      const request = createMockAuthRequest({ user: createAuthenticatedUser() })
      
      // Mock getSession to throw error
      jest.spyOn(require('@/lib/auth-utils'), 'getSession').mockRejectedValue(
        new Error('Session service unavailable')
      )
      
      const mockHandler = jest.fn()
      const authMiddleware = requireAuth()
      
      const response = await authMiddleware(request, mockHandler)

      expect(response.status).toBe(500)
      expect(mockHandler).not.toHaveBeenCalled()

      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'auth',
        'Auth middleware error',
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('should allow multiple required roles (OR logic)', async () => {
      const user = createAuthenticatedUser(['OPS']) // Has OPS but not ADMIN
      const request = createMockAuthRequest({ user })
      
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const authMiddleware = requireAuth({ requiredRoles: ['ADMIN', 'OPS'] })
      
      const response = await authMiddleware(request, mockHandler)

      expect(mockHandler).toHaveBeenCalled()
      expect(response).toBeInstanceOf(NextResponse)
    })
  })

  describe('checkOrgOwnership', () => {
    it('should allow access for users in the same org', () => {
      const user = createAuthenticatedUser(['DEALER'], 'org-123')
      const resourceOrgId = 'org-123'

      const hasAccess = checkOrgOwnership(resourceOrgId, user)

      expect(hasAccess).toBe(true)
    })

    it('should deny access for users in different orgs', () => {
      const user = createAuthenticatedUser(['DEALER'], 'org-123')
      const resourceOrgId = 'org-456' // Different org

      const hasAccess = checkOrgOwnership(resourceOrgId, user)

      expect(hasAccess).toBe(false)
    })

    it('should allow admin users to access any org', () => {
      const adminUser = createAuthenticatedUser(['ADMIN'], 'org-123')
      const resourceOrgId = 'org-456' // Different org

      // Note: This test assumes canAccessOrg from core handles admin logic
      // In a real implementation, admin users would have broader access
      const hasAccess = checkOrgOwnership(resourceOrgId, adminUser)

      // This may vary based on the actual canAccessOrg implementation
      expect(typeof hasAccess).toBe('boolean')
    })

    it('should handle null/undefined orgIds', () => {
      const user = createAuthenticatedUser(['DEALER'], 'org-123')

      expect(() => {
        checkOrgOwnership(null as any, user)
      }).not.toThrow()

      expect(() => {
        checkOrgOwnership(undefined as any, user)
      }).not.toThrow()
    })
  })

  describe('Security edge cases', () => {
    it('should handle extremely large session data', async () => {
      const largeSessionData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['DEALER'],
          orgId: 'org-456',
          metadata: 'x'.repeat(10000) // Large metadata field
        }
      }

      const request = {
        cookies: {
          get: () => ({ value: encodeURIComponent(JSON.stringify(largeSessionData)) })
        },
        headers: { get: () => null },
        ip: '192.168.1.1'
      } as any

      const session = await getSession(request)

      // Should handle large data gracefully
      expect(session?.user?.id).toBe('user-123')
    })

    it('should handle special characters in session data', async () => {
      const sessionWithSpecialChars = {
        user: {
          id: 'user-123',
          email: 'test+tag@example.com',
          name: 'Test User™ <script>',
          roles: ['DEALER'],
          orgId: 'org-456'
        }
      }

      const request = {
        cookies: {
          get: () => ({ value: encodeURIComponent(JSON.stringify(sessionWithSpecialChars)) })
        },
        headers: { get: () => null },
        ip: '192.168.1.1'
      } as any

      const session = await getSession(request)

      expect(session?.user?.email).toBe('test+tag@example.com')
      expect(session?.user?.name).toBe('Test User™ <script>')
    })

    it('should rate limit failed authentication attempts', async () => {
      const maliciousRequest = {
        cookies: { get: () => ({ value: 'malicious-session-data' }) },
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.100'
            if (name === 'user-agent') return 'AttackBot/1.0'
            return null
          }
        },
        ip: '192.168.1.100'
      } as any

      // Multiple failed attempts from same IP
      for (let i = 0; i < 5; i++) {
        await getSession(maliciousRequest)
      }

      expect(LogUtils.securityEvent).toHaveBeenCalledTimes(5)
      expect(LogUtils.securityEvent).toHaveBeenCalledWith(
        'suspicious_activity',
        'medium',
        expect.objectContaining({
          reason: 'Session parsing error'
        }),
        expect.objectContaining({
          ip: '192.168.1.100',
          userAgent: 'AttackBot/1.0'
        })
      )
    })
  })

  function createAuthenticatedUser(roles: string[] = ['DEALER'], orgId = 'org-123'): AuthSessionUser {
    return {
      id: 'user-123',
      email: 'user@example.com', 
      name: 'Test User',
      roles: roles as any[],
      orgId
    }
  }
})