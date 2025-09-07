import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface ActivityLogEntry {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'CONVERT' | 'ASSIGN' | 'LOGIN' | 'LOGOUT'
  entityType?: 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Task' | 'Pipeline' | 'Stage' | 'User'
  entityId?: string
  entityName?: string
  userId: string
  userName: string
  userRole: string
  timestamp: Date
  description: string
  details?: Record<string, any>
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  metadata?: {
    ip?: string
    userAgent?: string
    source?: 'web' | 'api' | 'system'
  }
}

export interface ActivityFilter {
  entityType?: string
  activityType?: string
  userId?: string
  dateRange?: string
  search?: string
}

export interface ActivityStats {
  totalActivities: number
  todayActivities: number
  weekActivities: number
  monthActivities: number
  topUsers: Array<{
    userId: string
    userName: string
    count: number
    lastActivity: Date
  }>
  topEntities: Array<{
    entityType: string
    count: number
    percentage: number
  }>
  activityTrends: Array<{
    date: string
    count: number
    entities: Record<string, number>
  }>
}

export interface UseActivityLogResult {
  activities: ActivityLogEntry[]
  stats: ActivityStats | null
  isLoading: boolean
  error: string | null
  loadActivities: (filter?: ActivityFilter) => Promise<void>
  loadStats: () => Promise<void>
  exportActivities: (filter?: ActivityFilter) => Promise<void>
  logActivity: (activityData: Partial<ActivityLogEntry>) => Promise<void>
}

export function useActivityLog(): UseActivityLogResult {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadActivities = async (filter: ActivityFilter = {}) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filter.entityType) params.set('entityType', filter.entityType)
      if (filter.activityType) params.set('activityType', filter.activityType)
      if (filter.userId) params.set('userId', filter.userId)
      if (filter.dateRange) params.set('dateRange', filter.dateRange)
      if (filter.search) params.set('search', filter.search)

      const response = await fetch(`/api/admin/activity-log?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.statusText}`)
      }

      const result = await response.json()
      setActivities(result.activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      })))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities')
      console.error('Error loading activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/activity-log?action=stats')
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`)
      }

      const statsData = await response.json()
      setStats({
        ...statsData,
        topUsers: statsData.topUsers.map((user: any) => ({
          ...user,
          lastActivity: new Date(user.lastActivity)
        }))
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      console.error('Error loading stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportActivities = async (filter: ActivityFilter = {}) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'export',
          filter
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export activities: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Create and download file
      const blob = new Blob([result.data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export activities')
      console.error('Error exporting activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const logActivity = async (activityData: Partial<ActivityLogEntry>) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    // This would typically be called automatically by repository actions
    // For manual logging, we can add the activity directly to our local state
    const newActivity: ActivityLogEntry = {
      id: `activity_${Date.now()}`,
      timestamp: new Date(),
      userId: user.id,
      userName: user.name || user.email,
      userRole: user.roles[0] || 'user',
      type: 'CREATE',
      description: 'Manual activity log entry',
      ...activityData
    }

    setActivities(prev => [newActivity, ...prev])
  }

  return {
    activities,
    stats,
    isLoading,
    error,
    loadActivities,
    loadStats,
    exportActivities,
    logActivity
  }
}

/**
 * Hook for logging specific activity types with convenience methods
 */
export function useActivityLogger() {
  const { user } = useAuth()

  const logEntityCreate = async (
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string,
    details?: Record<string, any>
  ) => {
    if (!user) return

    // In a real implementation, this would call the activity service
    console.log('Activity logged:', {
      type: 'CREATE',
      entityType,
      entityId,
      entityName,
      userId: user.id,
      userName: user.name || user.email,
      description: `Created ${entityType?.toLowerCase()} "${entityName}"`,
      details
    })
  }

  const logEntityUpdate = async (
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string,
    changes: ActivityLogEntry['changes']
  ) => {
    if (!user) return

    console.log('Activity logged:', {
      type: 'UPDATE',
      entityType,
      entityId,
      entityName,
      userId: user.id,
      userName: user.name || user.email,
      description: `Updated ${entityType?.toLowerCase()} "${entityName}"`,
      changes
    })
  }

  const logEntityDelete = async (
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string
  ) => {
    if (!user) return

    console.log('Activity logged:', {
      type: 'DELETE',
      entityType,
      entityId,
      entityName,
      userId: user.id,
      userName: user.name || user.email,
      description: `Deleted ${entityType?.toLowerCase()} "${entityName}"`
    })
  }

  const logDealMove = async (
    dealId: string,
    dealName: string,
    fromStage: string,
    toStage: string,
    pipelineName: string
  ) => {
    if (!user) return

    console.log('Activity logged:', {
      type: 'MOVE',
      entityType: 'Deal' as const,
      entityId: dealId,
      entityName: dealName,
      userId: user.id,
      userName: user.name || user.email,
      description: `Moved deal "${dealName}" from "${fromStage}" to "${toStage}"`,
      details: {
        fromStage,
        toStage,
        pipelineName
      }
    })
  }

  const logLeadConvert = async (
    leadId: string,
    leadName: string,
    dealId: string,
    dealValue: number
  ) => {
    if (!user) return

    console.log('Activity logged:', {
      type: 'CONVERT',
      entityType: 'Lead' as const,
      entityId: leadId,
      entityName: leadName,
      userId: user.id,
      userName: user.name || user.email,
      description: `Converted lead "${leadName}" to deal ($${dealValue.toLocaleString()})`,
      details: {
        createdDealId: dealId,
        dealValue
      }
    })
  }

  return {
    logEntityCreate,
    logEntityUpdate,
    logEntityDelete,
    logDealMove,
    logLeadConvert
  }
}