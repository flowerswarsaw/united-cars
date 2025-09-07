'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, Zap, TrendingUp, Database, Cpu, HardDrive, Wifi, BarChart3 } from 'lucide-react'
import { systemHealthService, SystemHealthStatus, HealthCheckResult, SystemMetrics, AlertRule, AutoRecoveryAction } from '@/lib/system-health'
import { formatDistanceToNow } from 'date-fns'

interface HealthDashboardProps {}

export default function HealthDashboard({}: HealthDashboardProps) {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadHealthStatus = async () => {
    try {
      setIsRefreshing(true)
      const status = await systemHealthService.getSystemHealth()
      setHealthStatus(status)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load health status:', error)
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  const executeRecoveryAction = async (actionId: string) => {
    try {
      const success = await systemHealthService.executeRecoveryAction(actionId)
      if (success) {
        await loadHealthStatus() // Refresh after action
      }
    } catch (error) {
      console.error('Recovery action failed:', error)
    }
  }

  useEffect(() => {
    loadHealthStatus()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadHealthStatus()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-orange-600 bg-orange-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
            <p className="text-sm text-muted-foreground">Monitor system performance and health metrics</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!healthStatus) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>Failed to load system health status. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Monitor system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={autoRefresh ? "default" : "secondary"}>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Settings className="w-4 h-4 mr-1" />
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHealthStatus}
            disabled={isRefreshing}
          >
            <Activity className="w-4 h-4 mr-1" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${getStatusColor(healthStatus.overall)}`}>
                {getStatusIcon(healthStatus.overall)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Health</p>
                <p className="text-2xl font-bold capitalize">{healthStatus.overall}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthStatus.score}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-green-50 text-green-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{formatUptime(healthStatus.uptime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                <p className="text-2xl font-bold capitalize">{healthStatus.environment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Health Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Health Checks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthStatus.checks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded-full ${getStatusColor(check.status)}`}>
                        {getStatusIcon(check.status)}
                      </div>
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {check.responseTime && (
                        <p className="text-sm font-medium">{check.responseTime}ms</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(check.timestamp)} ago
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Version</span>
                    <span className="font-medium">{healthStatus.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Updated</span>
                    <span className="font-medium">{formatDistanceToNow(healthStatus.lastUpdated)} ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Refresh</span>
                    <span className="font-medium">{formatDistanceToNow(lastRefresh)} ago</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Health Check Summary</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">
                        {healthStatus.checks.filter(c => c.status === 'healthy').length}
                      </p>
                      <p className="text-xs text-green-600">Healthy</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <p className="text-lg font-bold text-orange-600">
                        {healthStatus.checks.filter(c => c.status === 'warning').length}
                      </p>
                      <p className="text-xs text-orange-600">Warning</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* CPU Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5" />
                  <span>CPU</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Usage</span>
                  <span className="font-medium">{healthStatus.metrics.cpu.usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Load Average</span>
                  <span className="font-medium">
                    {healthStatus.metrics.cpu.load.map(l => l.toFixed(2)).join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Memory Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5" />
                  <span>Memory</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Used</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.memory.used * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.memory.total * 1024 * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Usage</span>
                  <span className="font-medium">{healthStatus.metrics.memory.percentage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Database Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Database</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Connections</span>
                  <span className="font-medium">{healthStatus.metrics.database.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pool Size</span>
                  <span className="font-medium">{healthStatus.metrics.database.poolSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Query Time</span>
                  <span className="font-medium">{healthStatus.metrics.database.queryTime.toFixed(1)}ms</span>
                </div>
              </CardContent>
            </Card>

            {/* Network Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5" />
                  <span>Network</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Bytes In</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.network.bytesIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bytes Out</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.network.bytesOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Connections</span>
                  <span className="font-medium">{healthStatus.metrics.network.connections}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cache Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Cache</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Hit Rate</span>
                  <span className="font-medium">{(healthStatus.metrics.cache.hitRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Hits</span>
                  <span className="font-medium">{healthStatus.metrics.cache.hits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Misses</span>
                  <span className="font-medium">{healthStatus.metrics.cache.misses.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Disk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5" />
                  <span>Disk</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Used</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.disk.used * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total</span>
                  <span className="font-medium">{formatBytes(healthStatus.metrics.disk.total * 1024)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Usage</span>
                  <span className="font-medium">{healthStatus.metrics.disk.percentage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alert Rules Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure automated alerts and notifications for system health issues
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealthService.getAlertRules().map((rule) => (
                <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.condition}</p>
                      </div>
                    </div>
                    <Badge variant={rule.severity === 'critical' ? 'destructive' : rule.severity === 'warning' ? 'secondary' : 'default'}>
                      {rule.severity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Threshold: </span>
                      <span className="font-medium">{rule.threshold}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cooldown: </span>
                      <span className="font-medium">{rule.cooldown}min</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Actions:</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.actions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Actions Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Recovery Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Automated recovery actions that can be triggered when health issues are detected
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemHealthService.getRecoveryActions().map((action) => (
                <div key={action.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{action.name}</p>
                      <p className="text-sm text-muted-foreground">{action.trigger}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeRecoveryAction(action.id)}
                    >
                      Execute
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Executed: </span>
                      <span className="font-medium">{action.executionCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate: </span>
                      <span className="font-medium">{(action.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run: </span>
                      <span className="font-medium">
                        {action.lastExecuted ? formatDistanceToNow(action.lastExecuted) + ' ago' : 'Never'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {action.action.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}