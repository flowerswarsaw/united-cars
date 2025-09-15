'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HistoryEntry, 
  EntityHistorySnapshot,
  historyAnalyticsUtils 
} from '@united-cars/crm-core/src/history-analytics';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { 
  Clock, 
  User, 
  Edit, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Download, 
  Eye, 
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface EntityHistoryViewerProps {
  entityType: string;
  entityId: string;
  userRole: UserRole;
  currentUserId: string;
  onExport?: (format: 'csv' | 'pdf') => void;
}

interface HistoryViewState {
  history: HistoryEntry[];
  activitySummary: any;
  isLoading: boolean;
  error: string | null;
  selectedEntry: HistoryEntry | null;
}

export function EntityHistoryViewer({
  entityType,
  entityId,
  userRole,
  currentUserId,
  onExport
}: EntityHistoryViewerProps) {
  const [state, setState] = useState<HistoryViewState>({
    history: [],
    activitySummary: null,
    isLoading: true,
    error: null,
    selectedEntry: null
  });

  // Load history data
  useEffect(() => {
    loadHistoryData();
  }, [entityType, entityId]);

  const loadHistoryData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real implementation, this would call the API
      const history = historyAnalyticsUtils.getEntityAuditTrail(entityType, entityId);
      
      // Mock activity summary - in real implementation would come from API
      const activitySummary = {
        totalChanges: history.length,
        lastModified: history.length > 0 ? history[0].timestamp : null,
        lastModifiedBy: history.length > 0 ? { 
          userId: history[0].userId, 
          userName: history[0].userName 
        } : null,
        operations: history.reduce((acc, entry) => {
          acc[entry.operation] = (acc[entry.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        frequentFields: getFrequentFields(history)
      };

      setState(prev => ({
        ...prev,
        history,
        activitySummary,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load history',
        isLoading: false
      }));
    }
  };

  const getFrequentFields = (history: HistoryEntry[]) => {
    const fieldCounts: Record<string, number> = {};
    
    history.forEach(entry => {
      entry.changedFields?.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });
    
    return Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([field, count]) => ({ field, count }));
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'RESTORE': return <RotateCcw className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE': return 'text-green-700 bg-green-50 border-green-200';
      case 'UPDATE': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DELETE': return 'text-red-700 bg-red-50 border-red-200';
      case 'RESTORE': return 'text-purple-700 bg-purple-50 border-purple-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatFieldChanges = (entry: HistoryEntry) => {
    if (!entry.changedFields || entry.changedFields.length === 0) {
      return 'No field changes recorded';
    }
    
    return entry.changedFields.join(', ');
  };

  const canViewDetails = (entry: HistoryEntry) => {
    // Admin can view all details
    if (userRole === UserRole.ADMIN) return true;
    
    // Users can view their own changes
    if (entry.userId === currentUserId) return true;
    
    // Senior managers can view team changes
    if (userRole === UserRole.SENIOR_SALES_MANAGER) return true;
    
    return false;
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      const data = state.history.map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        operation: entry.operation,
        userId: entry.userId,
        userName: entry.userName || '',
        changedFields: entry.changedFields?.join(', ') || '',
        reason: entry.reason || '',
        ipAddress: entry.ipAddress || '',
        userAgent: entry.userAgent || ''
      }));
      
      if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${entityType}_${entityId}_history.csv`, 'text/csv');
      }
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csv;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state.isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load history: {state.error}
        </AlertDescription>
      </Alert>
    );
  }

  if (state.history.length === 0) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          No history available for this entity.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      {state.activitySummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Activity Summary</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Changes</div>
                <div className="text-2xl font-bold">{state.activitySummary.totalChanges}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Modified</div>
                <div className="text-sm font-medium">
                  {state.activitySummary.lastModified 
                    ? formatDistanceToNow(new Date(state.activitySummary.lastModified), { addSuffix: true })
                    : 'Never'
                  }
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Modified By</div>
                <div className="text-sm font-medium">
                  {state.activitySummary.lastModifiedBy?.userName || 
                   state.activitySummary.lastModifiedBy?.userId || 'Unknown'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Most Changed Field</div>
                <div className="text-sm font-medium">
                  {state.activitySummary.frequentFields[0]?.field || 'None'}
                </div>
              </div>
            </div>
            
            {/* Operation breakdown */}
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(state.activitySummary.operations).map(([operation, count]) => (
                <Badge key={operation} variant="outline" className="gap-1">
                  {getOperationIcon(operation)}
                  {operation}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.history.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline connector */}
                {index < state.history.length - 1 && (
                  <div className="absolute left-6 top-12 w-px h-12 bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  {/* Operation icon */}
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 
                    ${getOperationColor(entry.operation)}
                  `}>
                    {getOperationIcon(entry.operation)}
                  </div>
                  
                  {/* Entry content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {entry.operation} {entityType.slice(0, -1)} {/* Remove 's' from plural */}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })} by{' '}
                          <span className="font-medium">
                            {entry.userName || entry.userId}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.timestamp.toLocaleString()}
                        </Badge>
                        
                        {canViewDetails(entry) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Change Details</DialogTitle>
                              </DialogHeader>
                              <HistoryEntryDetails entry={entry} />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                    
                    {/* Changed fields */}
                    {entry.changedFields && entry.changedFields.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Changed fields: </span>
                        <span className="font-medium">{formatFieldChanges(entry)}</span>
                      </div>
                    )}
                    
                    {/* Reason */}
                    {entry.reason && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reason: </span>
                        <span className="italic">{entry.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Detailed view of a history entry
function HistoryEntryDetails({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Operation</div>
          <div className="flex items-center gap-2">
            {entry.operation === 'CREATE' && <Plus className="h-4 w-4 text-green-600" />}
            {entry.operation === 'UPDATE' && <Edit className="h-4 w-4 text-blue-600" />}
            {entry.operation === 'DELETE' && <Trash2 className="h-4 w-4 text-red-600" />}
            {entry.operation === 'RESTORE' && <RotateCcw className="h-4 w-4 text-purple-600" />}
            <span className="font-medium">{entry.operation}</span>
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
          <div className="font-mono text-sm">
            {entry.timestamp.toLocaleString()}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">User</div>
          <div className="font-medium">
            {entry.userName || entry.userId}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">IP Address</div>
          <div className="font-mono text-sm">
            {entry.ipAddress || 'Not recorded'}
          </div>
        </div>
      </div>
      
      {entry.reason && (
        <div>
          <div className="text-sm font-medium text-muted-foreground">Reason</div>
          <div className="italic">{entry.reason}</div>
        </div>
      )}
      
      {entry.changedFields && entry.changedFields.length > 0 && (
        <div>
          <div className="text-sm font-medium text-muted-foreground">Changed Fields</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.changedFields.map(field => (
              <Badge key={field} variant="outline" className="text-xs">
                {field}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Tabs defaultValue="after" className="w-full">
        <TabsList>
          <TabsTrigger value="before">Before</TabsTrigger>
          <TabsTrigger value="after">After</TabsTrigger>
        </TabsList>
        
        <TabsContent value="before" className="mt-4">
          <div className="rounded border p-4 bg-red-50">
            <pre className="text-sm whitespace-pre-wrap">
              {entry.beforeData 
                ? JSON.stringify(entry.beforeData, null, 2)
                : 'No previous data available'
              }
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="after" className="mt-4">
          <div className="rounded border p-4 bg-green-50">
            <pre className="text-sm whitespace-pre-wrap">
              {entry.afterData 
                ? JSON.stringify(entry.afterData, null, 2)
                : 'No updated data available'
              }
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="text-xs text-muted-foreground border-t pt-4">
        <div>Entry ID: {entry.id}</div>
        <div>Checksum: {entry.checksum}</div>
        {entry.userAgent && <div>User Agent: {entry.userAgent}</div>}
      </div>
    </div>
  );
}