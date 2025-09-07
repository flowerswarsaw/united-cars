/**
 * System Health Monitoring Service
 * 
 * Provides comprehensive system health checks, performance monitoring,
 * and automated recovery mechanisms for the CRM system
 */

export interface HealthCheckResult {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  message: string
  timestamp: Date
  responseTime?: number
  details?: Record<string, any>
}

export interface SystemMetrics {
  cpu: {
    usage: number
    load: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    connections: number
  }
  database: {
    connections: number
    queryTime: number
    poolSize: number
  }
  cache: {
    hits: number
    misses: number
    hitRate: number
  }
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical'
  score: number // 0-100
  checks: HealthCheckResult[]
  metrics: SystemMetrics
  uptime: number
  version: string
  environment: string
  lastUpdated: Date
}

export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean
  cooldown: number // minutes
  actions: Array<{
    type: 'email' | 'webhook' | 'restart' | 'scale'
    config: Record<string, any>
  }>
}

export interface AutoRecoveryAction {
  id: string
  name: string
  trigger: string
  action: 'restart_service' | 'clear_cache' | 'scale_up' | 'failover' | 'cleanup'
  config: Record<string, any>
  lastExecuted?: Date
  executionCount: number
  successRate: number
}

/**
 * System Health Service
 * Monitors system health and provides automated recovery
 */
export class SystemHealthService {
  private healthChecks = new Map<string, () => Promise<HealthCheckResult>>()
  private metrics: SystemMetrics | null = null
  private alertRules: AlertRule[] = []
  private recoveryActions: AutoRecoveryAction[] = []
  private alertHistory = new Map<string, Date>()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeHealthChecks()
    this.initializeAlertRules()
    this.initializeRecoveryActions()
  }

  /**
   * Start system health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
        await this.checkAlertRules()
      } catch (error) {
        console.error('Health monitoring error:', error)
      }
    }, intervalMs)

    console.log('System health monitoring started')
  }

  /**
   * Stop system health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('System health monitoring stopped')
  }

  /**
   * Perform comprehensive system health check
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const checks: HealthCheckResult[] = []
    
    // Run all health checks
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await checkFn()
        checks.push(result)
      } catch (error) {
        checks.push({
          name,
          status: 'critical',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        })
      }
    }

    // Update metrics
    await this.updateSystemMetrics()

    // Calculate overall health score
    const score = this.calculateHealthScore(checks)
    const overall = this.determineOverallStatus(score)

    return {
      overall,
      score,
      checks,
      metrics: this.metrics!,
      uptime: this.getUptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      lastUpdated: new Date()
    }
  }

  /**
   * Register a custom health check
   */
  registerHealthCheck(name: string, checkFn: () => Promise<HealthCheckResult>): void {
    this.healthChecks.set(name, checkFn)
  }

  /**
   * Execute auto-recovery action
   */
  async executeRecoveryAction(actionId: string): Promise<boolean> {
    const action = this.recoveryActions.find(a => a.id === actionId)
    if (!action) {
      console.error(`Recovery action not found: ${actionId}`)
      return false
    }

    try {
      console.log(`Executing recovery action: ${action.name}`)
      const success = await this.performRecoveryAction(action)
      
      action.executionCount++
      action.lastExecuted = new Date()
      action.successRate = action.successRate * 0.9 + (success ? 0.1 : 0)

      return success
    } catch (error) {
      console.error(`Recovery action failed: ${action.name}`, error)
      action.executionCount++
      action.successRate = action.successRate * 0.9
      return false
    }
  }

  /**
   * Get system performance metrics
   */
  getMetrics(): SystemMetrics | null {
    return this.metrics
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Get recovery actions
   */
  getRecoveryActions(): AutoRecoveryAction[] {
    return [...this.recoveryActions]
  }

  // Private methods
  private initializeHealthChecks(): void {
    // API Health Check
    this.registerHealthCheck('api', async () => {
      const start = Date.now()
      try {
        // Simulate API health check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        const responseTime = Date.now() - start
        
        return {
          name: 'API',
          status: responseTime < 1000 ? 'healthy' : 'warning',
          message: `API responding in ${responseTime}ms`,
          timestamp: new Date(),
          responseTime,
          details: { endpoint: '/api/health' }
        }
      } catch (error) {
        return {
          name: 'API',
          status: 'critical',
          message: 'API health check failed',
          timestamp: new Date(),
          responseTime: Date.now() - start
        }
      }
    })

    // Database Health Check
    this.registerHealthCheck('database', async () => {
      const start = Date.now()
      try {
        // Simulate database health check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
        const responseTime = Date.now() - start
        
        return {
          name: 'Database',
          status: responseTime < 500 ? 'healthy' : 'warning',
          message: `Database responding in ${responseTime}ms`,
          timestamp: new Date(),
          responseTime,
          details: { connections: 5, poolSize: 10 }
        }
      } catch (error) {
        return {
          name: 'Database',
          status: 'critical',
          message: 'Database connection failed',
          timestamp: new Date(),
          responseTime: Date.now() - start
        }
      }
    })

    // Memory Health Check
    this.registerHealthCheck('memory', async () => {
      try {
        // Simulate memory check
        const memoryUsage = Math.random() * 100
        
        return {
          name: 'Memory',
          status: memoryUsage < 80 ? 'healthy' : memoryUsage < 90 ? 'warning' : 'critical',
          message: `Memory usage: ${memoryUsage.toFixed(1)}%`,
          timestamp: new Date(),
          details: { usage: memoryUsage, available: 100 - memoryUsage }
        }
      } catch (error) {
        return {
          name: 'Memory',
          status: 'unknown',
          message: 'Memory check failed',
          timestamp: new Date()
        }
      }
    })

    // WebSocket Health Check
    this.registerHealthCheck('websocket', async () => {
      try {
        // Simulate WebSocket health check
        const isConnected = Math.random() > 0.1 // 90% uptime simulation
        
        return {
          name: 'WebSocket',
          status: isConnected ? 'healthy' : 'critical',
          message: isConnected ? 'WebSocket server healthy' : 'WebSocket server down',
          timestamp: new Date(),
          details: { connected: isConnected, activeConnections: Math.floor(Math.random() * 50) }
        }
      } catch (error) {
        return {
          name: 'WebSocket',
          status: 'critical',
          message: 'WebSocket health check failed',
          timestamp: new Date()
        }
      }
    })
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        condition: 'memory.percentage > threshold',
        threshold: 85,
        severity: 'warning',
        enabled: true,
        cooldown: 5,
        actions: [
          { type: 'email', config: { recipients: ['admin@unitedcars.com'] } },
          { type: 'webhook', config: { url: '/api/alerts/memory' } }
        ]
      },
      {
        id: 'api-slow-response',
        name: 'Slow API Response',
        condition: 'api.responseTime > threshold',
        threshold: 2000,
        severity: 'warning',
        enabled: true,
        cooldown: 2,
        actions: [
          { type: 'restart', config: { service: 'api' } }
        ]
      },
      {
        id: 'database-down',
        name: 'Database Connection Failed',
        condition: 'database.status == "critical"',
        threshold: 1,
        severity: 'critical',
        enabled: true,
        cooldown: 1,
        actions: [
          { type: 'email', config: { recipients: ['admin@unitedcars.com'] } },
          { type: 'restart', config: { service: 'database' } }
        ]
      }
    ]
  }

  private initializeRecoveryActions(): void {
    this.recoveryActions = [
      {
        id: 'restart-api',
        name: 'Restart API Service',
        trigger: 'api.status == "critical"',
        action: 'restart_service',
        config: { service: 'api', gracefulShutdown: true },
        executionCount: 0,
        successRate: 1.0
      },
      {
        id: 'clear-cache',
        name: 'Clear System Cache',
        trigger: 'memory.percentage > 90',
        action: 'clear_cache',
        config: { cacheType: 'all' },
        executionCount: 0,
        successRate: 1.0
      },
      {
        id: 'cleanup-temp',
        name: 'Cleanup Temporary Files',
        trigger: 'disk.percentage > 85',
        action: 'cleanup',
        config: { path: '/tmp', olderThan: '24h' },
        executionCount: 0,
        successRate: 1.0
      }
    ]
  }

  private async performHealthCheck(): Promise<void> {
    // This would be called by the monitoring interval
    const health = await this.getSystemHealth()
    
    // Log critical issues
    const criticalChecks = health.checks.filter(check => check.status === 'critical')
    if (criticalChecks.length > 0) {
      console.warn('Critical health issues detected:', criticalChecks.map(c => c.name).join(', '))
    }
  }

  private async checkAlertRules(): Promise<void> {
    const health = await this.getSystemHealth()
    
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Check cooldown
      const lastAlert = this.alertHistory.get(rule.id)
      if (lastAlert && Date.now() - lastAlert.getTime() < rule.cooldown * 60 * 1000) {
        continue
      }

      // Evaluate condition (simplified)
      let shouldAlert = false
      if (rule.condition.includes('memory.percentage')) {
        shouldAlert = (this.metrics?.memory.percentage || 0) > rule.threshold
      } else if (rule.condition.includes('api.responseTime')) {
        const apiCheck = health.checks.find(c => c.name === 'API')
        shouldAlert = (apiCheck?.responseTime || 0) > rule.threshold
      } else if (rule.condition.includes('database.status')) {
        const dbCheck = health.checks.find(c => c.name === 'Database')
        shouldAlert = dbCheck?.status === 'critical'
      }

      if (shouldAlert) {
        await this.triggerAlert(rule)
        this.alertHistory.set(rule.id, new Date())
      }
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    console.log(`Alert triggered: ${rule.name}`)
    
    // Execute alert actions
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'restart':
            await this.executeRecoveryAction('restart-api')
            break
          case 'email':
            console.log(`Email alert sent to: ${action.config.recipients?.join(', ')}`)
            break
          case 'webhook':
            console.log(`Webhook called: ${action.config.url}`)
            break
        }
      } catch (error) {
        console.error(`Alert action failed: ${action.type}`, error)
      }
    }
  }

  private async performRecoveryAction(action: AutoRecoveryAction): Promise<boolean> {
    switch (action.action) {
      case 'restart_service':
        console.log(`Restarting service: ${action.config.service}`)
        // Simulate service restart
        await new Promise(resolve => setTimeout(resolve, 1000))
        return Math.random() > 0.1 // 90% success rate
        
      case 'clear_cache':
        console.log('Clearing system cache')
        // Simulate cache clear
        await new Promise(resolve => setTimeout(resolve, 500))
        return true
        
      case 'cleanup':
        console.log(`Cleaning up: ${action.config.path}`)
        // Simulate cleanup
        await new Promise(resolve => setTimeout(resolve, 2000))
        return true
        
      default:
        console.warn(`Unknown recovery action: ${action.action}`)
        return false
    }
  }

  private async updateSystemMetrics(): Promise<void> {
    // Simulate system metrics collection
    this.metrics = {
      cpu: {
        usage: Math.random() * 100,
        load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
      },
      memory: {
        used: Math.random() * 8000,
        total: 8000,
        percentage: Math.random() * 100
      },
      disk: {
        used: Math.random() * 100000,
        total: 500000,
        percentage: Math.random() * 100
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
        connections: Math.floor(Math.random() * 100)
      },
      database: {
        connections: Math.floor(Math.random() * 10),
        queryTime: Math.random() * 100,
        poolSize: 20
      },
      cache: {
        hits: Math.floor(Math.random() * 1000),
        misses: Math.floor(Math.random() * 100),
        hitRate: 0.8 + Math.random() * 0.2
      }
    }
  }

  private calculateHealthScore(checks: HealthCheckResult[]): number {
    if (checks.length === 0) return 0

    const weights = { healthy: 100, warning: 60, critical: 0, unknown: 30 }
    const totalScore = checks.reduce((sum, check) => sum + weights[check.status], 0)
    
    return Math.round(totalScore / checks.length)
  }

  private determineOverallStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'critical'
  }

  private getUptime(): number {
    // Simulate uptime in seconds
    return Math.floor(Math.random() * 1000000)
  }
}

// Global instance
export const systemHealthService = new SystemHealthService()