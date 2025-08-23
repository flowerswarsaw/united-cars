import { z } from 'zod'

// User session type
export interface AuthSessionUser {
  id: string
  email: string
  name?: string
  orgId: string
  roles: string[]
}

export interface AuthSession {
  user: AuthSessionUser
}

// Role types
export type Role = 'ADMIN' | 'OPS' | 'DEALER'
export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'

// Standardized API error response
export interface AuthApiError {
  code: string
  message: string
  details?: string
}

/**
 * Validates session user object structure
 */
export function isValidSessionUser(user: any): user is AuthSessionUser {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.orgId === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role: any) => typeof role === 'string')
  )
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthSessionUser, requiredRoles: Role | Role[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.some(role => user.roles.includes(role))
}

/**
 * Check if user has admin-level permissions
 */
export function isAdmin(user: AuthSessionUser): boolean {
  return hasRole(user, ['ADMIN', 'OPS'])
}

/**
 * Check if user can access org-scoped resource
 */
export function canAccessOrg(user: AuthSessionUser, orgId: string): boolean {
  // Admins and OPS can access any org
  if (isAdmin(user)) {
    return true
  }
  
  // Others can only access their own org
  return user.orgId === orgId
}

/**
 * Build org-scoped where clause for database queries
 */
export function buildOrgWhereClause(user: AuthSessionUser, baseWhere: any = {}): any {
  if (isAdmin(user)) {
    return baseWhere
  }
  
  return {
    ...baseWhere,
    orgId: user.orgId
  }
}

/**
 * Input validation helpers
 */
export const AuthPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25)
})

export const AuthIdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

/**
 * Rate limiting identifier generator
 */
export function createRateLimitId(user: AuthSessionUser, operation: string): string {
  return `${operation}:${user.id}:${user.orgId}`
}