'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { cn } from '@/lib/utils'
import type { ChangeLog, EntityType, ActivityType } from '@united-cars/crm-core'

interface ChangeLogProps {
  entityType: EntityType
  entityId: string
  limit?: number
  className?: string
}

interface ChangeLogListProps {
  changeLogs: ChangeLog[]
  className?: string
}

const ActivityBadge: React.FC<{ activity: ActivityType }> = ({ activity }) => {
  const getVariant = (activity: ActivityType): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (activity) {
      case 'CREATED':
        return 'default'
      case 'UPDATED':
      case 'FIELD_CHANGED':
      case 'AMOUNT_CHANGED':
        return 'secondary'
      case 'DELETED':
        return 'destructive'
      case 'STATUS_CHANGED':
      case 'STAGE_MOVED':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getDisplayText = (activity: ActivityType): string => {
    switch (activity) {
      case 'CREATED':
        return 'Created'
      case 'UPDATED':
        return 'Updated'
      case 'DELETED':
        return 'Deleted'
      case 'FIELD_CHANGED':
        return 'Field Changed'
      case 'STATUS_CHANGED':
        return 'Status Changed'
      case 'STAGE_MOVED':
        return 'Stage Moved'
      case 'AMOUNT_CHANGED':
        return 'Amount Changed'
      default:
        return activity
    }
  }

  return (
    <Badge variant={getVariant(activity)} className="text-xs">
      {getDisplayText(activity)}
    </Badge>
  )
}

const ChangeLogItem: React.FC<{ changeLog: ChangeLog }> = ({ changeLog }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const hasChanges = changeLog.changes && changeLog.changes.length > 0

  return (
    <div className="border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ActivityBadge activity={changeLog.action} />
            <span className="text-sm text-muted-foreground">
              {formatDate(changeLog.createdAt)}
            </span>
            {changeLog.userName && (
              <span className="text-sm font-medium">
                by {changeLog.userName}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground mb-2">
            {changeLog.summary}
          </p>
          {hasChanges && (
            <div className="space-y-1">
              {changeLog.changes.map((change, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <span className="font-medium capitalize">{change.field}:</span>
                  {change.displayOldValue && (
                    <span className="ml-1">
                      <span className="line-through text-destructive">{change.displayOldValue}</span>
                      <span className="mx-1">→</span>
                    </span>
                  )}
                  <span className="text-foreground">{change.displayNewValue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ChangeLogList: React.FC<ChangeLogListProps> = ({ changeLogs, className }) => {
  if (!changeLogs || changeLogs.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p>No activity history found.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {changeLogs.map((changeLog) => (
        <ChangeLogItem key={changeLog.id} changeLog={changeLog} />
      ))}
    </div>
  )
}

export const ChangeLogPanel: React.FC<ChangeLogProps> = ({ 
  entityType, 
  entityId, 
  limit = 50, 
  className 
}) => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChangeLogs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/crm/change-logs?entityType=${entityType}&entityId=${entityId}&limit=${limit}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch change logs: ${response.statusText}`)
        }
        
        const data = await response.json()
        setChangeLogs(data.changeLogs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch change logs')
        console.error('Error fetching change logs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (entityType && entityId) {
      fetchChangeLogs()
    }
  }, [entityType, entityId, limit])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Activity History</CardTitle>
        <CardDescription>
          Recent changes and activity for this {entityType.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeLogList changeLogs={changeLogs} />
      </CardContent>
    </Card>
  )
}

// Hook for programmatic access to change logs
export const useChangeLog = (entityType: EntityType, entityId: string, limit?: number) => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/crm/change-logs?entityType=${entityType}&entityId=${entityId}&limit=${limit || 50}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch change logs: ${response.statusText}`)
      }
      
      const data = await response.json()
      setChangeLogs(data.changeLogs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch change logs')
      console.error('Error fetching change logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (entityType && entityId) {
      refresh()
    }
  }, [entityType, entityId, limit])

  return { changeLogs, isLoading, error, refresh }
}

export { type ChangeLog, type EntityType, type ActivityType }