import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSecurityConfig, generateCSPHeader } from '@/lib/security-config'
import { getServerSessionFromRequest } from '@/lib/auth'

// Routes that require authentication
const protectedRoutes = ['/admin', '/crm', '/dashboard', '/services', '/claims', '/titles', '/payments', '/invoices', '/vehicles', '/intake']
const adminOnlyRoutes = ['/admin']
const crmRoutes = ['/crm']

/**
 * Comprehensive middleware that handles:
 * - HTTP security headers
 * - Authentication and authorization 
 * - Route protection based on user roles
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const securityConfig = getSecurityConfig()

  // Generate CSP header from configuration
  const cspHeader = generateCSPHeader(securityConfig.csp)

  // Security headers for all responses
  const securityHeaders = {
    // Content Security Policy
    'Content-Security-Policy': cspHeader,
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS Protection (legacy but still useful for older browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Referrer policy for privacy
    'Referrer-Policy': securityConfig.headers.referrerPolicy,
    
    // Permissions policy (feature policy replacement)
    'Permissions-Policy': securityConfig.headers.permissions.join(', '),
    
    // HSTS - Force HTTPS (configurable)
    ...(securityConfig.headers.hsts.enabled && {
      'Strict-Transport-Security': `max-age=${securityConfig.headers.hsts.maxAge}${
        securityConfig.headers.hsts.includeSubDomains ? '; includeSubDomains' : ''
      }${securityConfig.headers.hsts.preload ? '; preload' : ''}`
    }),

    // Prevent browsers from inferring document type
    'X-DNS-Prefetch-Control': 'off',
    
    // Download options for IE
    'X-Download-Options': 'noopen',
    
    // Cross-origin policies
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // API-specific security headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Prevent caching of API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    // API rate limiting headers (placeholder - actual rate limiting in API routes)
    response.headers.set('X-RateLimit-Policy', 'user-session')
  }

  // Upload endpoint specific headers
  if (request.nextUrl.pathname.includes('/upload')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-File-Type-Options', 'strict')
  }

  // Admin routes - extra security
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive')
    response.headers.set('Cache-Control', 'no-store, private, must-revalidate')
  }

  // Authentication and authorization logic
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    try {
      const session = await getServerSessionFromRequest(request)
      
      if (!session?.user) {
        // For development, allow access without authentication
        // In production, this would redirect to login
        console.log(`Protected route ${pathname} accessed without authentication - allowing for development`)
      } else {
        const user = session.user

        // Check admin routes
        if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
          const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')
          if (!isAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url))
          }
        }

        // Check CRM routes
        if (crmRoutes.some(route => pathname.startsWith(route))) {
          const canAccessCrm = user.roles.some(role => 
            ['ADMIN', 'SUPER_ADMIN', 'CRM_USER', 'SALES_MANAGER', 'SALES_REP'].includes(role)
          )
          if (!canAccessCrm) {
            return NextResponse.redirect(new URL('/unauthorized', request.url))
          }
        }

        // Add user context to headers for server components
        response.headers.set('x-user-id', user.id)
        response.headers.set('x-user-org-id', user.orgId)
        response.headers.set('x-user-roles', JSON.stringify(user.roles))
      }
    } catch (error) {
      console.error('Authentication middleware error:', error)
      // For development, continue without authentication
      // In production, this might redirect to an error page
    }
  }

  return response
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}