'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Shield, 
  Zap, 
  Users, 
  FileText,
  TrendingUp,
  Clock,
  HardDrive,
  Cpu,
  Memory
} from 'lucide-react';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { RoleGuard, AdminOnlyGuard } from '../rbac/RoleGuard';

export interface SystemHealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  version: string;
  checks: SystemHealthCheck[];
  statistics?: {
    totalRecords: number;
    organisations: number;
    contacts: number;
    deals: number;
    leads: number;
    uniquenessConstraints: number;
    historyEntries: number;
    lastSaved?: string;
    dataSize: string;
  };
  uniquenessStatus?: {
    totalConstraints: number;
    integrity: {
      valid: boolean;
      corruptedEntries: string[];
    };
  };
  historyStatus?: {
    totalEntries: number;
    entitiesCovered: number;
    operationBreakdown: Record<string, number>;
    entityTypeBreakdown: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  };
  dataIntegrity?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    repaired: string[];
  };
  performance?: {
    averageResponseTime: number;
    requestsPerMinute: number;
    memoryUsage: {
      used: number;
      total: number;
    };
    uptime: number;
  };
}

export interface SystemHealthDashboardProps {
  userRole: UserRole;
  onRefresh?: () => void;
  onRunDiagnostic?: (operation: string) => Promise<any>;
  className?: string;
}

export function SystemHealthDashboard({
  userRole,
  onRefresh,
  onRunDiagnostic,
  className
}: SystemHealthDashboardProps) {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticRunning, setDiagnosticRunning] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async (detailed = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/crm/enhanced/system/health?detailed=${detailed}`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      setHealthData(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadHealthData(userRole === 'admin');
    }
  };

  const runDiagnostic = async (operation: string) => {
    if (!onRunDiagnostic) return;
    
    setDiagnosticRunning(operation);
    try {
      const result = await onRunDiagnostic(operation);
      console.log(`Diagnostic ${operation} completed:`, result);
      // Refresh health data after diagnostic
      await loadHealthData(true);
    } catch (err) {
      console.error(`Diagnostic ${operation} failed:`, err);
    } finally {
      setDiagnosticRunning(null);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error' | 'pass' | 'fail') => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'error':
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error' | 'pass' | 'fail') => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'error':
      case 'fail':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>System health check failed: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!healthData) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>No health data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthData.status)}
              System Health Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                v{healthData.version}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded border-2 ${getStatusColor(healthData.status)}`}>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(healthData.status)}
                <span className="font-semibold capitalize">{healthData.status}</span>
              </div>
              <p className="text-sm">
                {healthData.status === 'healthy' 
                  ? 'All systems operational'
                  : healthData.status === 'warning'
                  ? 'Some issues detected'
                  : 'Critical issues found'
                }
              </p>
            </div>
            
            <div className="p-4 rounded border-2 border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-semibold">Last Check</span>
              </div>
              <p className="text-sm">
                {new Date(healthData.timestamp).toLocaleString()}
              </p>
            </div>
            
            <div className="p-4 rounded border-2 border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-gray-600" />
                <span className="font-semibold">Health Checks</span>
              </div>
              <p className="text-sm">
                {healthData.checks.filter(c => c.status === 'pass').length} / {healthData.checks.length} passing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">System Checks</TabsTrigger>
          <RoleGuard userRole={userRole} requiredRole={[UserRole.ADMIN, UserRole.SENIOR_SALES_MANAGER]} mode="hide">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </RoleGuard>
          <AdminOnlyGuard userRole={userRole} mode="hide">
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </AdminOnlyGuard>
          <AdminOnlyGuard userRole={userRole} mode="hide">
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </AdminOnlyGuard>
        </TabsList>

        {/* System Checks */}
        <TabsContent value="checks">
          <div className="grid gap-4">
            {healthData.checks.map((check, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h3 className="font-medium">{check.name}</h3>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    
                    <Badge variant={check.status === 'pass' ? 'default' : 'destructive'}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {check.details && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Statistics */}
        <RoleGuard userRole={userRole} requiredRole={[UserRole.ADMIN, UserRole.SENIOR_SALES_MANAGER]} mode="hide">
          <TabsContent value="statistics">
            {healthData.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Total Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.statistics.totalRecords.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All entities</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.statistics.organisations.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Active orgs</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Deals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.statistics.deals.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">In pipeline</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      History Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.statistics.historyEntries.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Audit trails</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {healthData.dataIntegrity && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Data Integrity Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center gap-2 mb-3 ${healthData.dataIntegrity.isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {healthData.dataIntegrity.isValid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {healthData.dataIntegrity.isValid ? 'Data Integrity Verified' : 'Data Integrity Issues Found'}
                    </span>
                  </div>
                  
                  {healthData.dataIntegrity.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-700">Errors:</p>
                      {healthData.dataIntegrity.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">• {error}</p>
                      ))}
                    </div>
                  )}
                  
                  {healthData.dataIntegrity.warnings.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium text-amber-700">Warnings:</p>
                      {healthData.dataIntegrity.warnings.map((warning, index) => (
                        <p key={index} className="text-sm text-amber-600">• {warning}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </RoleGuard>

        {/* Performance */}
        <AdminOnlyGuard userRole={userRole} mode="hide">
          <TabsContent value="performance">
            {healthData.performance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.performance.averageResponseTime}ms</div>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Requests/Min
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthData.performance.requestsPerMinute}</div>
                    <p className="text-xs text-muted-foreground">Current rate</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Memory className="h-4 w-4" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((healthData.performance.memoryUsage.used / healthData.performance.memoryUsage.total) * 100)}%
                    </div>
                    <Progress 
                      value={(healthData.performance.memoryUsage.used / healthData.performance.memoryUsage.total) * 100} 
                      className="mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {healthData.performance.memoryUsage.used}MB / {healthData.performance.memoryUsage.total}MB
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Uptime
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatUptime(healthData.performance.uptime)}</div>
                    <p className="text-xs text-muted-foreground">System uptime</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </AdminOnlyGuard>

        {/* Diagnostics */}
        <AdminOnlyGuard userRole={userRole} mode="hide">
          <TabsContent value="diagnostics">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => runDiagnostic('integrity_check')}
                      disabled={diagnosticRunning === 'integrity_check'}
                    >
                      {diagnosticRunning === 'integrity_check' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Data Integrity Check
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => runDiagnostic('cache_clear')}
                      disabled={diagnosticRunning === 'cache_clear'}
                    >
                      {diagnosticRunning === 'cache_clear' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Clear Caches
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => runDiagnostic('backup_create')}
                      disabled={diagnosticRunning === 'backup_create'}
                    >
                      {diagnosticRunning === 'backup_create' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <HardDrive className="h-4 w-4 mr-2" />
                      )}
                      Create Backup
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => runDiagnostic('stats_refresh')}
                      disabled={diagnosticRunning === 'stats_refresh'}
                    >
                      {diagnosticRunning === 'stats_refresh' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-2" />
                      )}
                      Refresh Statistics
                    </Button>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These diagnostic operations may temporarily impact system performance. 
                      Run them during low-usage periods when possible.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </AdminOnlyGuard>
      </Tabs>
    </div>
  );
}