'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react'
import { getGlobalPersistenceManager } from '@united-cars/mock-data'

interface SystemHealthData {
  persistence: any
  dataIntegrity: any
  syncStatus?: any
  environment: string
  timestamp: Date
}

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealthData = async () => {
    try {
      const persistenceManager = await getGlobalPersistenceManager()
      const health = await persistenceManager.getSystemHealth()
      setHealthData(health)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-600' : 'text-red-600'
    }
    
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
      case 'synced':
        return 'text-green-600'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600'
      case 'error':
      case 'offline':
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return (
        <Badge variant={status ? 'default' : 'destructive'}>
          {status ? 'Healthy' : 'Unhealthy'}
        </Badge>
      )
    }

    const variant = 
      ['healthy', 'online', 'synced'].includes(status?.toLowerCase()) ? 'default' :
      ['warning', 'degraded'].includes(status?.toLowerCase()) ? 'secondary' :
      'destructive'

    return <Badge variant={variant}>{status}</Badge>
  }

  if (isLoading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading system health data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Health</h1>
          <p className="text-text-secondary mt-2">
            Real-time monitoring and system diagnostics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-text-secondary">
            <Clock className="w-4 h-4 inline mr-1" />
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button 
            onClick={fetchHealthData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Environment</div>
                <div className="text-2xl font-bold capitalize">{healthData?.environment || 'development'}</div>
              </div>
              <Server className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Data Health</div>
                <div className="text-2xl font-bold">
                  {healthData?.dataIntegrity?.issues?.length === 0 ? 'Good' : 'Issues'}
                </div>
              </div>
              <Database className={`w-8 h-8 ${healthData?.dataIntegrity?.issues?.length === 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Persistence</div>
                <div className="text-2xl font-bold">Online</div>
              </div>
              <HardDrive className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Sync Status</div>
                <div className="text-2xl font-bold">
                  {healthData?.syncStatus ? 'Synced' : 'Offline'}
                </div>
              </div>
              <Wifi className={`w-8 h-8 ${healthData?.syncStatus ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="persistence">Persistence</TabsTrigger>
          <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  System Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Persistence Service</span>
                  {getStatusBadge('healthy')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Validation</span>
                  {getStatusBadge(healthData?.dataIntegrity?.issues?.length === 0 ? 'healthy' : 'warning')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Backup System</span>
                  {getStatusBadge('healthy')}
                </div>
                <div className="flex items-center justify-between">
                  <span>Cross-System Sync</span>
                  {getStatusBadge(healthData?.syncStatus ? 'synced' : 'offline')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Last Health Check:</span>
                    <div className="text-text-secondary mt-1">
                      {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Data Issues Found:</span>
                    <div className={`mt-1 ${healthData?.dataIntegrity?.issues?.length === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {healthData?.dataIntegrity?.issues?.length || 0} issues detected
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Environment:</span>
                    <div className="text-text-secondary mt-1 capitalize">
                      {healthData?.environment || 'development'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="persistence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Persistence Statistics</CardTitle>
              <CardDescription>
                Detailed information about data persistence and storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthData?.persistence ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{healthData.persistence.entityCount || 0}</div>
                      <div className="text-sm text-text-secondary">Total Entities</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{healthData.persistence.backupCount || 0}</div>
                      <div className="text-sm text-text-secondary">Backups Available</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{healthData.persistence.versionCount || 0}</div>
                      <div className="text-sm text-text-secondary">Version History</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-text-secondary">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(healthData.persistence, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  No persistence data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Integrity Report</CardTitle>
              <CardDescription>
                Validation results and data consistency checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthData?.dataIntegrity ? (
                <div className="space-y-4">
                  {healthData.dataIntegrity.issues.length === 0 ? (
                    <div className="flex items-center text-green-600 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      All data integrity checks passed
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {healthData.dataIntegrity.issues.map((issue: any, index: number) => (
                        <div key={index} className="flex items-center text-orange-600 p-4 bg-orange-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <div>
                            <div className="font-medium">{issue.type}</div>
                            <div className="text-sm text-orange-600/80">{issue.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-text-secondary">
                    <span className="font-medium">Summary:</span>
                    <div className="mt-1">
                      {healthData.dataIntegrity.summary || 'Data integrity validation completed'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  No integrity data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>
                Cross-system synchronization and data consistency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthData?.syncStatus ? (
                <div className="space-y-4">
                  <div className="text-sm text-text-secondary">
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(healthData.syncStatus, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-gray-600 p-4 bg-gray-50 rounded-lg">
                  <Wifi className="w-5 h-5 mr-2" />
                  Cross-system synchronization is not configured
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}