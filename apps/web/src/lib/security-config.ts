/**
 * Centralized security configuration
 * Defines security policies, headers, and validation rules
 */

export interface SecurityConfig {
  csp: {
    defaultSrc: string[]
    scriptSrc: string[]
    styleSrc: string[]
    fontSrc: string[]
    imgSrc: string[]
    connectSrc: string[]
    frameSrc: string[]
    objectSrc: string[]
  }
  headers: {
    hsts: {
      enabled: boolean
      maxAge: number
      includeSubDomains: boolean
      preload: boolean
    }
    referrerPolicy: string
    permissions: string[]
  }
  uploads: {
    maxFileSize: number
    allowedMimeTypes: string[]
    maxFilesPerRequest: number
    scanForViruses: boolean
  }
  rateLimit: {
    windowMs: number
    maxRequests: number
    blockDurationMs: number
  }
  session: {
    maxAge: number
    secure: boolean
    httpOnly: boolean
    sameSite: 'strict' | 'lax' | 'none'
  }
}

export const getSecurityConfig = (): SecurityConfig => {
  const isProduction = process.env.NODE_ENV === 'production'

  // Build script-src based on environment
  // In production, avoid unsafe-eval for better security
  // In development, it may be needed for hot module replacement
  const scriptSrc = isProduction
    ? ["'self'", "'unsafe-inline'", 'https://vercel.live']
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live']

  return {
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc,
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        'https://fonts.googleapis.com'
      ],
      fontSrc: [
        "'self'", 
        'https://fonts.gstatic.com'
      ],
      imgSrc: [
        "'self'", 
        'data:', 
        'https:', 
        'blob:'
      ],
      connectSrc: [
        "'self'",
        'https://vercel.live',
        'wss://ws-us3.pusher.com',
        // Twilio Voice SDK
        'wss://*.twilio.com',
        'https://*.twilio.com',
        'https://sdk.twilio.com'
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    },
    headers: {
      hsts: {
        enabled: isProduction,
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissions: [
        'camera=()',
        'microphone=(self)', // Allow microphone for Twilio Voice
        'geolocation=()',
        'interest-cohort=()',
        'payment=()',
        'usb=()'
      ]
    },
    uploads: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ],
      maxFilesPerRequest: 10,
      scanForViruses: isProduction // Enable virus scanning in production
    },
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100,
      blockDurationMs: 60 * 60 * 1000 // 1 hour
    },
    session: {
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      secure: isProduction,
      httpOnly: true,
      sameSite: 'strict'
    }
  }
}

/**
 * Generate CSP header string from configuration
 */
export const generateCSPHeader = (config: SecurityConfig['csp']): string => {
  const directives = [
    `default-src ${config.defaultSrc.join(' ')}`,
    `script-src ${config.scriptSrc.join(' ')}`,
    `style-src ${config.styleSrc.join(' ')}`,
    `font-src ${config.fontSrc.join(' ')}`,
    `img-src ${config.imgSrc.join(' ')}`,
    `connect-src ${config.connectSrc.join(' ')}`,
    `frame-src ${config.frameSrc.join(' ')}`,
    `object-src ${config.objectSrc.join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]
  
  return directives.join('; ')
}

/**
 * Validate upload against security policy
 */
export const validateUpload = (
  file: File, 
  config: SecurityConfig['uploads']
): { valid: boolean; error?: string } => {
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(config.maxFileSize / (1024 * 1024))}MB limit`
    }
  }
  
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }
  
  return { valid: true }
}

/**
 * Security audit log entry structure
 */
export interface SecurityAuditLog {
  timestamp: string
  event: string
  userId?: string
  orgId?: string
  ip: string
  userAgent: string
  resource: string
  action: string
  result: 'success' | 'blocked' | 'error'
  details?: Record<string, any>
}

/**
 * Create security audit log entry
 */
export const createSecurityAuditLog = (
  event: string,
  request: Request,
  result: SecurityAuditLog['result'],
  details?: Record<string, any>
): SecurityAuditLog => {
  return {
    timestamp: new Date().toISOString(),
    event,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    resource: new URL(request.url).pathname,
    action: request.method,
    result,
    details
  }
}