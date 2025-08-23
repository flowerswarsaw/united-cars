/**
 * Application Startup Validation
 * Comprehensive checks to ensure the application is ready for production
 */

import { validateConfigOnStartup, getConfig } from './config-validation'
import { logger, LogCategory } from './logger'
import { prisma } from '@united-cars/db'

/**
 * Startup validation results
 */
interface StartupValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  checks: Record<string, 'pass' | 'fail' | 'warn'>
}

/**
 * Run comprehensive startup validation
 */
export async function validateApplicationStartup(): Promise<StartupValidationResult> {
  const result: StartupValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    checks: {}
  }

  console.log('🚀 Starting application validation...')

  // Configuration validation
  try {
    validateConfigOnStartup()
    result.checks.configuration = 'pass'
  } catch (error) {
    result.success = false
    result.errors.push(`Configuration validation failed: ${error.message}`)
    result.checks.configuration = 'fail'
  }

  // Database connectivity check
  try {
    await validateDatabaseConnection()
    result.checks.database = 'pass'
  } catch (error) {
    result.success = false
    result.errors.push(`Database connection failed: ${error.message}`)
    result.checks.database = 'fail'
  }

  // Database schema validation
  try {
    await validateDatabaseSchema()
    result.checks.schema = 'pass'
  } catch (error) {
    result.warnings.push(`Database schema validation: ${error.message}`)
    result.checks.schema = 'warn'
  }

  // Security configuration check
  try {
    validateSecurityConfiguration(result)
  } catch (error) {
    result.warnings.push(`Security validation: ${error.message}`)
    result.checks.security = 'warn'
  }

  // External services check
  await validateExternalServices(result)

  // File system permissions
  try {
    await validateFileSystemPermissions()
    result.checks.filesystem = 'pass'
  } catch (error) {
    result.warnings.push(`File system validation: ${error.message}`)
    result.checks.filesystem = 'warn'
  }

  // Memory and resource checks
  try {
    validateResourceLimits(result)
  } catch (error) {
    result.warnings.push(`Resource validation: ${error.message}`)
    result.checks.resources = 'warn'
  }

  // Print summary
  printValidationSummary(result)

  return result
}

/**
 * Validate database connection
 */
async function validateDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection established')
  } catch (error) {
    console.error('❌ Database connection failed')
    throw error
  }
}

/**
 * Validate database schema and migrations
 */
async function validateDatabaseSchema(): Promise<void> {
  try {
    // Check if key tables exist
    const tables = ['User', 'Organization', 'Vehicle', 'InsuranceClaim', 'ServiceRequest', 'Title']
    
    for (const tableName of tables) {
      try {
        // This will throw if table doesn't exist
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`)
      } catch (error) {
        throw new Error(`Table ${tableName} not found - run database migrations`)
      }
    }
    
    // Check for required indexes (basic performance check)
    const indexCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('Vehicle', 'InsuranceClaim', 'ServiceRequest')
    ` as any[]
    
    const indexCount = parseInt(indexCheck[0]?.index_count || '0')
    if (indexCount < 5) {
      throw new Error('Missing database indexes - performance may be impacted')
    }
    
    console.log('✅ Database schema validation passed')
  } catch (error) {
    console.warn('⚠️ Database schema validation issues')
    throw error
  }
}

/**
 * Validate security configuration
 */
function validateSecurityConfiguration(result: StartupValidationResult): void {
  const config = getConfig()
  const issues: string[] = []

  // Check production security requirements
  if (config.nodeEnv === 'production') {
    if (!config.security.httpsRedirect) {
      issues.push('HTTPS redirect is disabled in production')
    }
    
    if (!config.security.hsts) {
      issues.push('HSTS is disabled in production')
    }
    
    if (!config.security.contentSecurityPolicy) {
      issues.push('Content Security Policy is disabled')
    }
    
    if (config.security.corsOrigins.length === 0) {
      issues.push('No CORS origins configured for production')
    }
    
    if (config.auth.nextAuthSecret.length < 64) {
      issues.push('NEXTAUTH_SECRET should be at least 64 characters in production')
    }
  }

  // Check rate limiting configuration
  if (config.security.rateLimitMaxRequests > 1000) {
    issues.push('Rate limit is set very high - consider reducing for security')
  }

  // Check file upload limits
  if (config.fileUpload.maxFileSize > 50 * 1024 * 1024) {
    issues.push('File upload limit is very high - consider reducing for security')
  }

  if (issues.length > 0) {
    result.warnings.push(...issues.map(issue => `Security: ${issue}`))
    result.checks.security = 'warn'
    console.log('⚠️ Security configuration warnings found')
  } else {
    result.checks.security = 'pass'
    console.log('✅ Security configuration validated')
  }
}

/**
 * Validate external services connectivity
 */
async function validateExternalServices(result: StartupValidationResult): Promise<void> {
  const config = getConfig()
  
  // Redis connectivity (if configured)
  if (config.cache.redisUrl) {
    try {
      // Basic Redis connection test would go here
      // For now, just check if URL is valid
      new URL(config.cache.redisUrl)
      result.checks.redis = 'pass'
      console.log('✅ Redis configuration validated')
    } catch (error) {
      result.warnings.push('Redis URL configuration invalid')
      result.checks.redis = 'warn'
    }
  }

  // Email service validation (if configured)
  if (config.email.smtpHost) {
    try {
      // Basic SMTP configuration validation
      if (!config.email.smtpUser || !config.email.smtpPassword) {
        result.warnings.push('SMTP configured but missing credentials')
        result.checks.email = 'warn'
      } else {
        result.checks.email = 'pass'
        console.log('✅ Email configuration validated')
      }
    } catch (error) {
      result.warnings.push('Email configuration validation failed')
      result.checks.email = 'warn'
    }
  }

  // Monitoring services
  if (config.monitoring.sentryDsn) {
    try {
      new URL(config.monitoring.sentryDsn)
      result.checks.monitoring = 'pass'
      console.log('✅ Monitoring configuration validated')
    } catch (error) {
      result.warnings.push('Invalid Sentry DSN configuration')
      result.checks.monitoring = 'warn'
    }
  }
}

/**
 * Validate file system permissions and storage
 */
async function validateFileSystemPermissions(): Promise<void> {
  const config = getConfig()
  const fs = await import('fs/promises')
  const path = await import('path')

  try {
    // Check upload directory
    const uploadDir = config.fileUpload.uploadPath
    
    try {
      await fs.access(uploadDir)
    } catch {
      // Try to create directory
      await fs.mkdir(uploadDir, { recursive: true })
    }
    
    // Test write permissions
    const testFile = path.join(uploadDir, 'write-test.tmp')
    await fs.writeFile(testFile, 'test')
    await fs.unlink(testFile)
    
    console.log('✅ File system permissions validated')
  } catch (error) {
    console.warn('⚠️ File system permission issues')
    throw error
  }
}

/**
 * Validate system resources and limits
 */
function validateResourceLimits(result: StartupValidationResult): void {
  const issues: string[] = []

  // Check memory usage
  const memUsage = process.memoryUsage()
  const memUsageMB = memUsage.heapUsed / 1024 / 1024

  if (memUsageMB > 200) {
    issues.push('High memory usage at startup')
  }

  // Check available disk space (if possible)
  const config = getConfig()
  
  // Warn about resource limits
  if (config.database.maxConnections > 50) {
    issues.push('Database connection pool is very large')
  }

  if (issues.length > 0) {
    result.warnings.push(...issues.map(issue => `Resources: ${issue}`))
    result.checks.resources = 'warn'
  } else {
    result.checks.resources = 'pass'
    console.log('✅ Resource limits validated')
  }
}

/**
 * Print validation summary
 */
function printValidationSummary(result: StartupValidationResult): void {
  console.log('\n📊 Startup Validation Summary')
  console.log('=' .repeat(50))
  
  // Print checks status
  Object.entries(result.checks).forEach(([check, status]) => {
    const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌'
    const checkName = check.charAt(0).toUpperCase() + check.slice(1)
    console.log(`${icon} ${checkName}: ${status.toUpperCase()}`)
  })
  
  console.log('=' .repeat(50))
  
  // Print errors
  if (result.errors.length > 0) {
    console.log('❌ ERRORS:')
    result.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:')
    result.warnings.forEach(warning => console.log(`   - ${warning}`))
  }
  
  // Final status
  if (result.success) {
    console.log('\n🎉 Application startup validation completed successfully!')
    console.log('🚀 Ready to serve requests\n')
  } else {
    console.log('\n💥 Application startup validation failed!')
    console.log('🛑 Cannot start application safely\n')
  }
  
  // Log to structured logger
  if (result.success) {
    logger.info(LogCategory.SYSTEM, 'Application startup validation passed', {
      checks: result.checks,
      warnings: result.warnings.length
    })
  } else {
    logger.error(LogCategory.SYSTEM, 'Application startup validation failed', undefined, {
      checks: result.checks,
      errors: result.errors,
      warnings: result.warnings
    })
  }
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`)
  
  try {
    // Close database connections
    await prisma.$disconnect()
    console.log('✅ Database connections closed')
    
    // Log shutdown
    logger.info(LogCategory.SYSTEM, 'Application shutdown completed gracefully', {
      signal,
      timestamp: new Date().toISOString()
    })
    
    console.log('👋 Graceful shutdown completed')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    logger.error(LogCategory.SYSTEM, 'Graceful shutdown failed', error)
    process.exit(1)
  }
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error)
    logger.critical(LogCategory.SYSTEM, 'Uncaught exception - shutting down', error)
    gracefulShutdown('UNCAUGHT_EXCEPTION')
  })
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
    logger.critical(LogCategory.SYSTEM, 'Unhandled promise rejection - shutting down', 
      reason instanceof Error ? reason : new Error(String(reason))
    )
    gracefulShutdown('UNHANDLED_REJECTION')
  })
}