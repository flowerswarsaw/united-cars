/**
 * Unit tests for structured logging system
 * Tests log formatting, categorization, and monitoring integration
 */

import {
  logger,
  LogLevel,
  LogCategory,
  RequestContext,
  PerformanceTracker,
  LogUtils
} from '@/lib/logger'

// Mock console methods to capture log output
const originalConsole = console

describe('Structured Logger System', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    jest.clearAllMocks()
  })

  afterAll(() => {
    Object.assign(console, originalConsole)
  })

  describe('RequestContext', () => {
    it('should create context with all properties', () => {
      const context = new RequestContext(
        'req-123',
        'user-456',
        'org-789',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(context.requestId).toBe('req-123')
      expect(context.userId).toBe('user-456')
      expect(context.orgId).toBe('org-789')
      expect(context.ip).toBe('192.168.1.1')
      expect(context.userAgent).toBe('Mozilla/5.0')
    })

    it('should add context to log entries', () => {
      const context = new RequestContext('req-123', 'user-456')
      const entry = { message: 'test', category: LogCategory.API }
      
      const withContext = context.withContext(entry)
      
      expect(withContext).toEqual({
        message: 'test',
        category: LogCategory.API,
        requestId: 'req-123',
        userId: 'user-456',
        orgId: undefined,
        ip: undefined,
        userAgent: undefined
      })
    })
  })

  describe('Core Logger', () => {
    it('should log API events with correct structure', () => {
      logger.api({
        method: 'GET',
        endpoint: '/api/vehicles',
        statusCode: 200,
        responseTime: 150,
        requestId: 'req-123'
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[api]')
      expect(logCall).toContain('GET /api/vehicles')
    })

    it('should log authentication events', () => {
      logger.auth({
        action: 'login',
        email: 'test@example.com',
        success: true,
        ip: '192.168.1.1'
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[auth]')
      expect(logCall).toContain('success')
    })

    it('should log security events with appropriate severity', () => {
      logger.security({
        event: 'rate_limit_exceeded',
        severity: 'high',
        details: { attempts: 10, timeWindow: '1min' },
        ip: '192.168.1.1'
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[security]')
      expect(logCall).toContain('Security event: rate_limit_exceeded')
    })

    it('should log performance metrics', () => {
      logger.performance({
        metric: 'response_time',
        value: 250,
        threshold: 200,
        endpoint: '/api/claims'
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[performance]')
      expect(logCall).toContain('250ms')
    })

    it('should log business events', () => {
      logger.business({
        entity: 'claim',
        action: 'CREATE',
        entityId: 'claim-123',
        newState: { status: 'new', amount: 5000 }
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[business]')
      expect(logCall).toContain('CREATE claim claim-123')
    })

    it('should handle errors in error logging', () => {
      const error = new Error('Database connection failed')
      error.stack = 'Error: Database connection failed\n    at test.js:1:1'

      logger.error(LogCategory.DATABASE, 'Connection error', error, {
        operation: 'findMany',
        table: 'vehicles'
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0][0]
      expect(logCall).toContain('[database]')
      expect(logCall).toContain('Connection error')
    })

    it('should use different log levels appropriately', () => {
      // Test info level
      logger.info(LogCategory.SYSTEM, 'System started')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'))

      // Test warn level
      logger.warn(LogCategory.SYSTEM, 'High memory usage')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))

      // Test critical level
      logger.critical(LogCategory.SECURITY, 'Security breach detected')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'))
    })
  })

  describe('PerformanceTracker', () => {
    it('should track and log response times', () => {
      const context = new RequestContext('req-123')
      const tracker = new PerformanceTracker('/api/test', context)

      // Simulate some processing time
      jest.advanceTimersByTime(100)

      const responseTime = tracker.finish(200)

      expect(responseTime).toBeGreaterThan(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[performance]')
      )
    })

    it('should track database query performance', () => {
      const context = new RequestContext('req-123')
      const tracker = new PerformanceTracker('/api/vehicles', context)

      tracker.trackQuery('SELECT * FROM vehicles WHERE org_id = ?')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('database_query')
      )
    })

    it('should warn on slow responses', async () => {
      const context = new RequestContext('req-123')

      // Use real timing to test slow responses
      const tracker = new PerformanceTracker('/api/slow-endpoint', context)

      // Wait a bit to simulate slow response
      await new Promise(resolve => setTimeout(resolve, 10))

      tracker.finish(200)

      // Should log performance metrics
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[performance]')
      )
    })
  })

  describe('LogUtils', () => {
    const mockContext = new RequestContext('req-123', 'user-456', 'org-789', '192.168.1.1')

    it('should log request start events', () => {
      const tracker = LogUtils.requestStart('POST', '/api/claims', mockContext)

      expect(tracker).toBeInstanceOf(PerformanceTracker)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/claims - Request started')
      )
    })

    it('should log request completion with timing', () => {
      LogUtils.requestComplete('GET', '/api/vehicles', 200, 150, mockContext)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/vehicles - 200 (150ms)')
      )
    })

    it('should log successful authentication', () => {
      LogUtils.authSuccess('login', 'user@example.com', mockContext)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth login: success')
      )
    })

    it('should log failed authentication with reason', () => {
      LogUtils.authFailure('login', 'user@example.com', 'Invalid password', mockContext)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth login: failed')
      )
    })

    it('should log security events with proper severity', () => {
      LogUtils.securityEvent(
        'unauthorized_access',
        'high',
        { endpoint: '/api/admin/users', reason: 'No admin role' },
        mockContext
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security event: unauthorized_access')
      )
    })
  })

  describe('Environment-specific behavior', () => {
    it('should format logs for development environment', () => {
      // Logger is instantiated at module load time with test environment
      // In test mode it outputs both readable format and JSON details
      logger.info(LogCategory.API, 'Test message', { extra: 'data' })

      expect(consoleSpy).toHaveBeenCalledTimes(2) // Both readable format and JSON details
      expect(consoleSpy.mock.calls[0][0]).toContain('[api] Test message')
      expect(consoleSpy.mock.calls[1][0]).toBe('  Details:')
    })

    it('should include JSON details in output', () => {
      logger.info(LogCategory.API, 'Test message')

      expect(consoleSpy).toHaveBeenCalledTimes(2)
      const logDetails = consoleSpy.mock.calls[1][1] // Second call contains JSON details
      expect(() => JSON.parse(logDetails)).not.toThrow()
    })

    it('should include correct environment and version in logs', () => {
      // Logger uses values captured at instantiation time
      logger.info(LogCategory.SYSTEM, 'Test message')

      const logDetails = consoleSpy.mock.calls[1][1] // Second call contains JSON details
      expect(JSON.parse(logDetails)).toMatchObject({
        environment: 'test',
        version: '1.0.0' // Default version when APP_VERSION is not set
      })
    })
  })

  describe('Error handling in logging', () => {
    it('should not crash when logging malformed data', () => {
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      expect(() => {
        logger.info(LogCategory.API, 'Test with circular reference', {
          data: circularObj
        })
      }).not.toThrow()
    })

    it('should handle undefined/null values gracefully', () => {
      expect(() => {
        logger.api({
          method: 'GET',
          endpoint: '/api/test',
          statusCode: undefined as any,
          responseTime: null as any
        })
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Log categorization', () => {
    it('should use correct log levels for security events by severity', () => {
      logger.security({
        event: 'suspicious_activity',
        severity: 'low',
        details: { reason: 'Multiple failed login attempts' }
      })

      expect(consoleSpy.mock.calls[0][0]).toContain('INFO')

      logger.security({
        event: 'data_breach',
        severity: 'critical',
        details: { affected_records: 1000 }
      })

      expect(consoleSpy.mock.calls[2][0]).toContain('CRITICAL')
    })

    it('should warn on slow performance metrics', () => {
      logger.performance({
        metric: 'response_time',
        value: 2000,
        threshold: 1000,
        endpoint: '/api/heavy-operation'
      })

      expect(consoleSpy.mock.calls[0][0]).toContain('WARN')
    })
  })
})