/**
 * Structured Logging System
 * Provides comprehensive logging with standardized formats for monitoring and observability
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum LogCategory {
  API = 'api',
  AUTH = 'auth',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  EXTERNAL = 'external',
  SYSTEM = 'system'
}

export interface BaseLogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  requestId?: string
  userId?: string
  orgId?: string
  environment: string
  version?: string
}

export interface ApiLogEntry extends BaseLogEntry {
  category: LogCategory.API
  method: string
  endpoint: string
  statusCode?: number
  responseTime?: number
  userAgent?: string
  ip?: string
  error?: {
    code: string
    stack?: string
  }
}

export interface AuthLogEntry extends BaseLogEntry {
  category: LogCategory.AUTH
  action: 'login' | 'logout' | 'register' | 'token_refresh' | 'access_denied' | 'password_change'
  email?: string
  success: boolean
  reason?: string
  ip?: string
}

export interface SecurityLogEntry extends BaseLogEntry {
  category: LogCategory.SECURITY
  event: 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access' | 'file_upload' | 'data_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  ip?: string
  userAgent?: string
}

export interface PerformanceLogEntry extends BaseLogEntry {
  category: LogCategory.PERFORMANCE
  metric: 'response_time' | 'database_query' | 'cache_hit' | 'cache_miss' | 'memory_usage'
  value: number
  threshold?: number
  endpoint?: string
  query?: string
}

export interface BusinessLogEntry extends BaseLogEntry {
  category: LogCategory.BUSINESS
  entity: 'vehicle' | 'claim' | 'service' | 'payment' | 'title'
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  entityId: string
  previousState?: any
  newState?: any
}

export type LogEntry = ApiLogEntry | AuthLogEntry | SecurityLogEntry | PerformanceLogEntry | BusinessLogEntry | BaseLogEntry

/**
 * Core logger class with structured output
 */
class StructuredLogger {
  private environment: string
  private version: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
    this.version = process.env.APP_VERSION || '1.0.0'
  }

  private createBaseEntry(level: LogLevel, category: LogCategory, message: string): BaseLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      environment: this.environment,
      version: this.version
    }
  }

  private output(entry: LogEntry) {
    let logString: string
    try {
      logString = JSON.stringify(entry)
    } catch (error) {
      // Handle circular references or other JSON.stringify issues
      logString = JSON.stringify({
        ...entry,
        error: '[Circular reference or non-serializable data]',
        fallback: true
      })
    }
    
    // In development and test environments, also output a readable format
    if (this.environment === 'development' || this.environment === 'test') {
      const readable = `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.category}] ${entry.message}`
      console.log(readable)
      console.log('  Details:', JSON.stringify(entry, null, 2))
    } else {
      // In production, output structured JSON for log aggregation
      console.log(logString)
    }

    // In production, send to monitoring service
    if (this.environment === 'production') {
      this.sendToMonitoringService(entry)
    }
  }

  private sendToMonitoringService(entry: LogEntry) {
    // TODO: Integrate with monitoring service (DataDog, New Relic, etc.)
    // For now, ensure it's properly formatted for ingestion
  }

  /**
   * API request/response logging
   */
  api(data: Omit<ApiLogEntry, keyof BaseLogEntry>): void {
    const entry: ApiLogEntry = {
      ...this.createBaseEntry(LogLevel.INFO, LogCategory.API, `${data.method} ${data.endpoint}`),
      ...data,
      category: LogCategory.API
    }
    this.output(entry)
  }

  /**
   * Authentication event logging
   */
  auth(data: Omit<AuthLogEntry, keyof BaseLogEntry>): void {
    const level = data.success ? LogLevel.INFO : LogLevel.WARN
    const entry: AuthLogEntry = {
      ...this.createBaseEntry(level, LogCategory.AUTH, `Auth ${data.action}: ${data.success ? 'success' : 'failed'}`),
      ...data,
      category: LogCategory.AUTH
    }
    this.output(entry)
  }

  /**
   * Security event logging
   */
  security(data: Omit<SecurityLogEntry, keyof BaseLogEntry>): void {
    const levelMap = {
      low: LogLevel.INFO,
      medium: LogLevel.WARN,
      high: LogLevel.ERROR,
      critical: LogLevel.CRITICAL
    }
    
    const entry: SecurityLogEntry = {
      ...this.createBaseEntry(levelMap[data.severity], LogCategory.SECURITY, `Security event: ${data.event}`),
      ...data,
      category: LogCategory.SECURITY
    }
    this.output(entry)
  }

  /**
   * Performance metrics logging
   */
  performance(data: Omit<PerformanceLogEntry, keyof BaseLogEntry>): void {
    const level = data.threshold && data.value > data.threshold ? LogLevel.WARN : LogLevel.INFO
    
    const entry: PerformanceLogEntry = {
      ...this.createBaseEntry(level, LogCategory.PERFORMANCE, `${data.metric}: ${data.value}ms`),
      ...data,
      category: LogCategory.PERFORMANCE
    }
    this.output(entry)
  }

  /**
   * Business logic event logging
   */
  business(data: Omit<BusinessLogEntry, keyof BaseLogEntry>): void {
    const entry: BusinessLogEntry = {
      ...this.createBaseEntry(LogLevel.INFO, LogCategory.BUSINESS, `${data.action} ${data.entity} ${data.entityId}`),
      ...data,
      category: LogCategory.BUSINESS
    }
    this.output(entry)
  }

  /**
   * Generic logging methods
   */
  info(category: LogCategory, message: string, details?: Record<string, any>): void {
    const entry = {
      ...this.createBaseEntry(LogLevel.INFO, category, message),
      ...details
    }
    this.output(entry)
  }

  warn(category: LogCategory, message: string, details?: Record<string, any>): void {
    const entry = {
      ...this.createBaseEntry(LogLevel.WARN, category, message),
      ...details
    }
    this.output(entry)
  }

  error(category: LogCategory, message: string, error?: Error, details?: Record<string, any>): void {
    const entry = {
      ...this.createBaseEntry(LogLevel.ERROR, category, message),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...details
    }
    this.output(entry)
  }

  critical(category: LogCategory, message: string, error?: Error, details?: Record<string, any>): void {
    const entry = {
      ...this.createBaseEntry(LogLevel.CRITICAL, category, message),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...details
    }
    this.output(entry)
  }
}

// Export singleton instance
export const logger = new StructuredLogger()

/**
 * Request context for consistent logging across a request lifecycle
 */
export class RequestContext {
  constructor(
    public requestId: string,
    public userId?: string,
    public orgId?: string,
    public ip?: string,
    public userAgent?: string
  ) {}

  withContext<T extends Partial<LogEntry>>(entry: T): T {
    return {
      ...entry,
      requestId: this.requestId,
      userId: this.userId,
      orgId: this.orgId,
      ip: this.ip,
      userAgent: this.userAgent
    }
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private startTime: number
  private context: RequestContext

  constructor(private endpoint: string, context: RequestContext) {
    this.startTime = Date.now()
    this.context = context
  }

  finish(statusCode?: number) {
    const responseTime = Date.now() - this.startTime
    
    logger.performance(
      this.context.withContext({
        metric: 'response_time',
        value: responseTime,
        threshold: 1000, // Warn if response time > 1s
        endpoint: this.endpoint
      })
    )

    return responseTime
  }

  trackQuery(query: string) {
    const queryTime = Date.now() - this.startTime
    
    logger.performance(
      this.context.withContext({
        metric: 'database_query',
        value: queryTime,
        threshold: 500, // Warn if query time > 500ms
        query
      })
    )
  }
}

/**
 * Utility functions for common logging patterns
 */
export const LogUtils = {
  /**
   * Log API request start
   */
  requestStart(method: string, endpoint: string, context: RequestContext): PerformanceTracker {
    logger.api(
      context.withContext({
        method,
        endpoint,
        message: `${method} ${endpoint} - Request started`
      })
    )
    
    return new PerformanceTracker(endpoint, context)
  },

  /**
   * Log API request completion
   */
  requestComplete(
    method: string, 
    endpoint: string, 
    statusCode: number, 
    responseTime: number,
    context: RequestContext
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO

    logger.api(
      context.withContext({
        method,
        endpoint,
        statusCode,
        responseTime,
        message: `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`
      })
    )
  },

  /**
   * Log successful authentication
   */
  authSuccess(action: AuthLogEntry['action'], email: string, context: RequestContext): void {
    logger.auth(
      context.withContext({
        action,
        email,
        success: true
      })
    )
  },

  /**
   * Log failed authentication
   */
  authFailure(action: AuthLogEntry['action'], email: string, reason: string, context: RequestContext): void {
    logger.auth(
      context.withContext({
        action,
        email,
        success: false,
        reason
      })
    )
  },

  /**
   * Log security events
   */
  securityEvent(
    event: SecurityLogEntry['event'], 
    severity: SecurityLogEntry['severity'],
    details: Record<string, any>,
    context: RequestContext
  ): void {
    logger.security(
      context.withContext({
        event,
        severity,
        details
      })
    )
  }
}