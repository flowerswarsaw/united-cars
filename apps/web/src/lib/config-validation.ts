/**
 * Environment Configuration Validation
 * Validates and sanitizes environment variables for security and reliability
 */

import { z } from 'zod'

/**
 * Database configuration schema
 */
const DatabaseConfigSchema = z.object({
  url: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  maxConnections: z.number().int().positive().default(10),
  connectionTimeout: z.number().int().positive().default(30000), // 30 seconds
  statementTimeout: z.number().int().positive().default(60000), // 60 seconds
  idleTimeout: z.number().int().positive().default(300000), // 5 minutes
})

/**
 * Authentication configuration schema  
 */
const AuthConfigSchema = z.object({
  nextAuthSecret: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  nextAuthUrl: z.string().url('NEXTAUTH_URL must be a valid URL'),
  sessionMaxAge: z.number().int().positive().default(2592000), // 30 days
  jwtMaxAge: z.number().int().positive().default(86400), // 24 hours
  bcryptRounds: z.number().int().min(10).max(15).default(12),
})

/**
 * Security configuration schema
 */
const SecurityConfigSchema = z.object({
  corsOrigins: z.array(z.string().url()).default([]),
  rateLimitWindow: z.number().int().positive().default(900000), // 15 minutes
  rateLimitMaxRequests: z.number().int().positive().default(100),
  csrfProtection: z.boolean().default(true),
  contentSecurityPolicy: z.boolean().default(true),
  httpsRedirect: z.boolean().default(true),
  hsts: z.boolean().default(true),
  hstsMaxAge: z.number().int().positive().default(31536000), // 1 year
})

/**
 * File upload configuration schema
 */
const FileUploadConfigSchema = z.object({
  maxFileSize: z.number().int().positive().default(10 * 1024 * 1024), // 10MB
  allowedMimeTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png', 
    'image/webp',
    'application/pdf'
  ]),
  uploadPath: z.string().min(1).default('/tmp/uploads'),
  virusScanning: z.boolean().default(false),
})

/**
 * Email configuration schema
 */
const EmailConfigSchema = z.object({
  smtpHost: z.string().min(1).optional(),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(true),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromAddress: z.string().email().optional(),
  fromName: z.string().default('United Cars'),
})

/**
 * Monitoring configuration schema
 */
const MonitoringConfigSchema = z.object({
  sentryDsn: z.string().url().optional(),
  datadogApiKey: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),
  enableMetrics: z.boolean().default(true),
  enableTracing: z.boolean().default(false),
  tracingSampleRate: z.number().min(0).max(1).default(0.1),
})

/**
 * Cache configuration schema
 */
const CacheConfigSchema = z.object({
  redisUrl: z.string().url().optional(),
  defaultTtl: z.number().int().positive().default(3600), // 1 hour
  maxMemoryMb: z.number().int().positive().default(100),
  enableCompression: z.boolean().default(true),
})

/**
 * Feature flags configuration schema
 */
const FeatureFlagsSchema = z.object({
  enableNewDashboard: z.boolean().default(false),
  enableAdvancedSearch: z.boolean().default(true),
  enableFileUploadV2: z.boolean().default(false),
  enableNotifications: z.boolean().default(true),
  enableAuditLogging: z.boolean().default(true),
  enablePerformanceMonitoring: z.boolean().default(true),
})

/**
 * Complete application configuration schema
 */
const AppConfigSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  
  // Application
  appName: z.string().default('United Cars'),
  appVersion: z.string().default('1.0.0'),
  buildId: z.string().default('local'),
  commitSha: z.string().default('unknown'),
  
  // Secrets validation
  apiKeys: z.object({
    internal: z.string().min(32).optional(),
    external: z.string().min(32).optional(),
  }).default({}),
  
  // Component configurations
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  security: SecurityConfigSchema,
  fileUpload: FileUploadConfigSchema,
  email: EmailConfigSchema,
  monitoring: MonitoringConfigSchema,
  cache: CacheConfigSchema,
  featureFlags: FeatureFlagsSchema,
})

export type AppConfig = z.infer<typeof AppConfigSchema>

/**
 * Load and validate environment configuration
 */
export function loadConfig(): AppConfig {
  try {
    const rawConfig = {
      // Environment
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
      host: process.env.HOST,
      
      // Application
      appName: process.env.APP_NAME,
      appVersion: process.env.APP_VERSION || process.env.npm_package_version,
      buildId: process.env.BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA,
      commitSha: process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA,
      
      // API Keys
      apiKeys: {
        internal: process.env.API_KEY_INTERNAL,
        external: process.env.API_KEY_EXTERNAL,
      },
      
      // Database
      database: {
        url: process.env.DATABASE_URL,
        maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : undefined,
        connectionTimeout: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT) : undefined,
        statementTimeout: process.env.DB_STATEMENT_TIMEOUT ? parseInt(process.env.DB_STATEMENT_TIMEOUT) : undefined,
        idleTimeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : undefined,
      },
      
      // Authentication
      auth: {
        nextAuthSecret: process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        sessionMaxAge: process.env.SESSION_MAX_AGE ? parseInt(process.env.SESSION_MAX_AGE) : undefined,
        jwtMaxAge: process.env.JWT_MAX_AGE ? parseInt(process.env.JWT_MAX_AGE) : undefined,
        bcryptRounds: process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : undefined,
      },
      
      // Security
      security: {
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : undefined,
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : undefined,
        rateLimitMaxRequests: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : undefined,
        csrfProtection: process.env.CSRF_PROTECTION ? process.env.CSRF_PROTECTION === 'true' : undefined,
        contentSecurityPolicy: process.env.CSP_ENABLED ? process.env.CSP_ENABLED === 'true' : undefined,
        httpsRedirect: process.env.HTTPS_REDIRECT ? process.env.HTTPS_REDIRECT === 'true' : undefined,
        hsts: process.env.HSTS_ENABLED ? process.env.HSTS_ENABLED === 'true' : undefined,
        hstsMaxAge: process.env.HSTS_MAX_AGE ? parseInt(process.env.HSTS_MAX_AGE) : undefined,
      },
      
      // File Upload
      fileUpload: {
        maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined,
        allowedMimeTypes: process.env.ALLOWED_MIME_TYPES ? process.env.ALLOWED_MIME_TYPES.split(',') : undefined,
        uploadPath: process.env.UPLOAD_PATH,
        virusScanning: process.env.VIRUS_SCANNING ? process.env.VIRUS_SCANNING === 'true' : undefined,
      },
      
      // Email
      email: {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
        smtpSecure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : undefined,
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD,
        fromAddress: process.env.EMAIL_FROM,
        fromName: process.env.EMAIL_FROM_NAME,
      },
      
      // Monitoring
      monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        datadogApiKey: process.env.DATADOG_API_KEY,
        logLevel: process.env.LOG_LEVEL,
        enableMetrics: process.env.ENABLE_METRICS ? process.env.ENABLE_METRICS === 'true' : undefined,
        enableTracing: process.env.ENABLE_TRACING ? process.env.ENABLE_TRACING === 'true' : undefined,
        tracingSampleRate: process.env.TRACING_SAMPLE_RATE ? parseFloat(process.env.TRACING_SAMPLE_RATE) : undefined,
      },
      
      // Cache
      cache: {
        redisUrl: process.env.REDIS_URL,
        defaultTtl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : undefined,
        maxMemoryMb: process.env.CACHE_MAX_MEMORY ? parseInt(process.env.CACHE_MAX_MEMORY) : undefined,
        enableCompression: process.env.CACHE_COMPRESSION ? process.env.CACHE_COMPRESSION === 'true' : undefined,
      },
      
      // Feature Flags
      featureFlags: {
        enableNewDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
        enableAdvancedSearch: process.env.FEATURE_ADVANCED_SEARCH !== 'false',
        enableFileUploadV2: process.env.FEATURE_FILE_UPLOAD_V2 === 'true',
        enableNotifications: process.env.FEATURE_NOTIFICATIONS !== 'false',
        enableAuditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false',
        enablePerformanceMonitoring: process.env.FEATURE_PERFORMANCE_MONITORING !== 'false',
      }
    }

    // Validate configuration
    const validatedConfig = AppConfigSchema.parse(rawConfig)
    
    // Additional security validations
    validateSecurityRequirements(validatedConfig)
    
    return validatedConfig
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n')
      
      throw new Error(`Configuration validation failed:\n${errorMessages}`)
    }
    
    throw error
  }
}

/**
 * Additional security validations that can't be expressed in Zod schemas
 */
function validateSecurityRequirements(config: AppConfig): void {
  // Production environment checks
  if (config.nodeEnv === 'production') {
    if (!config.auth.nextAuthSecret) {
      throw new Error('NEXTAUTH_SECRET is required in production')
    }
    
    if (config.auth.nextAuthSecret.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters in production')
    }
    
    if (!config.database.url.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must use SSL in production (postgresql://)')
    }
    
    if (!config.security.httpsRedirect) {
      console.warn('⚠️  HTTPS redirect is disabled in production')
    }
    
    if (!config.security.hsts) {
      console.warn('⚠️  HSTS is disabled in production')
    }
    
    if (config.monitoring.logLevel === 'debug') {
      console.warn('⚠️  Debug logging is enabled in production')
    }
  }
  
  // Database URL security
  if (config.database.url && !config.database.url.includes('ssl=') && config.nodeEnv === 'production') {
    console.warn('⚠️  Database connection may not be using SSL')
  }
  
  // CORS validation
  if (config.security.corsOrigins.length === 0 && config.nodeEnv === 'production') {
    console.warn('⚠️  No CORS origins configured for production')
  }
  
  // Rate limiting validation
  if (config.security.rateLimitMaxRequests > 1000) {
    console.warn('⚠️  Rate limit is set very high (>1000 requests)')
  }
  
  // File upload security
  if (config.fileUpload.maxFileSize > 50 * 1024 * 1024) { // 50MB
    console.warn('⚠️  Maximum file size is very large (>50MB)')
  }
  
  // Feature flag warnings
  if (config.featureFlags.enableFileUploadV2 && config.nodeEnv === 'production') {
    console.warn('⚠️  Experimental file upload v2 is enabled in production')
  }
}

/**
 * Get typed configuration for the application
 */
let cachedConfig: AppConfig | null = null

export function getConfig(): AppConfig {
  if (cachedConfig === null) {
    cachedConfig = loadConfig()
  }
  return cachedConfig
}

/**
 * Validate configuration on startup
 */
export function validateConfigOnStartup(): void {
  try {
    const config = getConfig()
    console.log('✅ Configuration validation passed')
    console.log(`📊 Environment: ${config.nodeEnv}`)
    console.log(`🚀 Version: ${config.appVersion} (${config.buildId})`)
    
    // Log security status
    if (config.nodeEnv === 'production') {
      console.log('🔒 Security features enabled:')
      console.log(`   - HTTPS Redirect: ${config.security.httpsRedirect}`)
      console.log(`   - HSTS: ${config.security.hsts}`)
      console.log(`   - CSP: ${config.security.contentSecurityPolicy}`)
      console.log(`   - CSRF Protection: ${config.security.csrfProtection}`)
      console.log(`   - Rate Limiting: ${config.security.rateLimitMaxRequests}/window`)
    }
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message)
    process.exit(1)
  }
}

/**
 * Export configuration types for use throughout the application
 */
export type {
  AppConfig as Config,
}

/**
 * Configuration validation utilities
 */
export const ConfigUtils = {
  isDevelopment: () => getConfig().nodeEnv === 'development',
  isProduction: () => getConfig().nodeEnv === 'production',
  isTest: () => getConfig().nodeEnv === 'test',
  isStaging: () => getConfig().nodeEnv === 'staging',
  
  isFeatureEnabled: (feature: keyof AppConfig['featureFlags']) => {
    return getConfig().featureFlags[feature]
  },
  
  getDatabaseConfig: () => getConfig().database,
  getSecurityConfig: () => getConfig().security,
  getMonitoringConfig: () => getConfig().monitoring,
}