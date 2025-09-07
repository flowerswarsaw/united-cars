/**
 * Activity Service for CRM System
 * 
 * Provides comprehensive activity logging and audit trail functionality
 * Tracks all user actions and system changes across CRM entities
 */

import { Activity } from '@united-cars/crm-core'

export interface ActivityLogEntry {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'CONVERT' | 'ASSIGN' | 'LOGIN' | 'LOGOUT'
  entityType?: 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Task' | 'Pipeline' | 'Stage' | 'User'
  entityId?: string
  entityName?: string
  userId: string
  userName: string
  userRole: string
  organizationId: string
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
    sessionId?: string
  }
}

export interface ActivityFilter {
  entityType?: string
  activityType?: string
  userId?: string
  organizationId?: string
  dateFrom?: Date
  dateTo?: Date
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

/**
 * Activity Service Class
 * Handles logging, retrieval, and analysis of system activities
 */
export class ActivityService {
  private activities: ActivityLogEntry[] = []

  constructor() {
    this.initializeWithMockData()
  }

  /**
   * Log a new activity
   */
  async logActivity(activityData: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<ActivityLogEntry> {
    const activity: ActivityLogEntry = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...activityData
    }

    this.activities.unshift(activity) // Add to beginning for reverse chronological order

    // In a real system, this would persist to database
    console.log('Activity logged:', activity)

    return activity
  }

  /**
   * Get activities with filtering and pagination
   */
  async getActivities(
    filter: ActivityFilter = {},
    offset: number = 0,
    limit: number = 50
  ): Promise<{
    activities: ActivityLogEntry[]
    total: number
    hasMore: boolean
  }> {
    let filtered = [...this.activities]

    // Apply filters
    if (filter.entityType) {
      filtered = filtered.filter(activity => activity.entityType === filter.entityType)
    }

    if (filter.activityType) {
      filtered = filtered.filter(activity => activity.type === filter.activityType)
    }

    if (filter.userId) {
      filtered = filtered.filter(activity => activity.userId === filter.userId)
    }

    if (filter.organizationId) {
      filtered = filtered.filter(activity => activity.organizationId === filter.organizationId)
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(activity => activity.timestamp >= filter.dateFrom!)
    }

    if (filter.dateTo) {
      filtered = filtered.filter(activity => activity.timestamp <= filter.dateTo!)
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchLower) ||
        activity.entityName?.toLowerCase().includes(searchLower) ||
        activity.userName.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const paginatedActivities = filtered.slice(offset, offset + limit)

    return {
      activities: paginatedActivities,
      total: filtered.length,
      hasMore: filtered.length > offset + limit
    }
  }

  /**
   * Get activity statistics and analytics
   */
  async getActivityStats(organizationId?: string): Promise<ActivityStats> {
    let activities = this.activities

    if (organizationId) {
      activities = activities.filter(activity => activity.organizationId === organizationId)
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Calculate basic stats
    const totalActivities = activities.length
    const todayActivities = activities.filter(a => a.timestamp >= today).length
    const weekActivities = activities.filter(a => a.timestamp >= weekAgo).length
    const monthActivities = activities.filter(a => a.timestamp >= monthAgo).length

    // Calculate top users
    const userActivityMap = new Map<string, { count: number, lastActivity: Date, userName: string }>()
    
    activities.forEach(activity => {
      const existing = userActivityMap.get(activity.userId) || { 
        count: 0, 
        lastActivity: new Date(0),
        userName: activity.userName
      }
      
      userActivityMap.set(activity.userId, {
        count: existing.count + 1,
        lastActivity: activity.timestamp > existing.lastActivity ? activity.timestamp : existing.lastActivity,
        userName: activity.userName
      })
    })

    const topUsers = Array.from(userActivityMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        count: data.count,
        lastActivity: data.lastActivity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate entity type distribution
    const entityTypeMap = new Map<string, number>()
    activities.forEach(activity => {
      if (activity.entityType) {
        entityTypeMap.set(activity.entityType, (entityTypeMap.get(activity.entityType) || 0) + 1)
      }
    })

    const topEntities = Array.from(entityTypeMap.entries())
      .map(([entityType, count]) => ({
        entityType,
        count,
        percentage: Math.round((count / totalActivities) * 100)
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate activity trends (last 30 days)
    const activityTrends: ActivityStats['activityTrends'] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      
      const dayActivities = activities.filter(a => a.timestamp >= date && a.timestamp < nextDate)
      
      const entities: Record<string, number> = {}
      dayActivities.forEach(activity => {
        if (activity.entityType) {
          entities[activity.entityType] = (entities[activity.entityType] || 0) + 1
        }
      })

      activityTrends.push({
        date: date.toISOString().split('T')[0],
        count: dayActivities.length,
        entities
      })
    }

    return {
      totalActivities,
      todayActivities,
      weekActivities,
      monthActivities,
      topUsers,
      topEntities,
      activityTrends
    }
  }

  /**
   * Get activity by ID
   */
  async getActivityById(id: string): Promise<ActivityLogEntry | null> {
    return this.activities.find(activity => activity.id === id) || null
  }

  /**
   * Delete old activities (for cleanup/retention)
   */
  async deleteOldActivities(olderThan: Date): Promise<number> {
    const initialCount = this.activities.length
    this.activities = this.activities.filter(activity => activity.timestamp >= olderThan)
    return initialCount - this.activities.length
  }

  /**
   * Export activities to JSON
   */
  async exportActivities(filter: ActivityFilter = {}): Promise<string> {
    const { activities } = await this.getActivities(filter, 0, Number.MAX_SAFE_INTEGER)
    return JSON.stringify(activities, null, 2)
  }

  /**
   * Helper method to track entity changes
   */
  detectChanges<T extends Record<string, any>>(oldEntity: T, newEntity: T): ActivityLogEntry['changes'] {
    const changes: ActivityLogEntry['changes'] = []

    Object.keys(newEntity).forEach(key => {
      const oldValue = oldEntity[key]
      const newValue = newEntity[key]

      // Skip metadata fields
      if (['id', 'createdAt', 'updatedAt', 'tenantId'].includes(key)) {
        return
      }

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue
        })
      }
    })

    return changes
  }

  /**
   * Initialize with mock data for development
   */
  private initializeWithMockData() {
    const mockActivities: ActivityLogEntry[] = [
      {
        id: 'activity-1',
        type: 'CREATE',
        entityType: 'Contact',
        entityId: 'contact-1',
        entityName: 'John Smith',
        userId: 'user-1',
        userName: 'System Administrator',
        userRole: 'admin',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: 'Created new contact "John Smith" for Acme Corporation',
        details: {
          contactInfo: {
            email: 'john.smith@acme.com',
            phone: '+1 (555) 123-4567'
          }
        },
        metadata: {
          source: 'web',
          ip: '192.168.1.100'
        }
      },
      {
        id: 'activity-2',
        type: 'UPDATE',
        entityType: 'Deal',
        entityId: 'deal-1',
        entityName: 'Q4 Expansion Deal',
        userId: 'user-2',
        userName: 'Sales Manager',
        userRole: 'sales_manager',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        description: 'Updated deal value from $45,000 to $52,000',
        changes: [
          { field: 'value', oldValue: 45000, newValue: 52000 },
          { field: 'notes', oldValue: 'Initial quote', newValue: 'Updated after negotiation' }
        ],
        metadata: {
          source: 'web'
        }
      },
      {
        id: 'activity-3',
        type: 'MOVE',
        entityType: 'Deal',
        entityId: 'deal-2',
        entityName: 'Integration Services Deal',
        userId: 'user-2',
        userName: 'Sales Manager',
        userRole: 'sales_manager',
        organizationId: 'org-1',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        description: 'Moved deal from "Proposal" to "Negotiation" stage',
        details: {
          fromStage: 'Proposal',
          toStage: 'Negotiation',
          pipelineName: 'Dealer Acquisition'
        },
        metadata: {
          source: 'web'
        }
      }
    ]

    this.activities = mockActivities
  }
}

// Global activity service instance
export const activityService = new ActivityService()

/**
 * Convenience functions for common activity logging patterns
 */
export class ActivityLogger {
  constructor(private service: ActivityService) {}

  async logEntityCreate(
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    userRole: string,
    organizationId: string,
    details?: Record<string, any>
  ) {
    return this.service.logActivity({
      type: 'CREATE',
      entityType,
      entityId,
      entityName,
      userId,
      userName,
      userRole,
      organizationId,
      description: `Created ${entityType?.toLowerCase()} "${entityName}"`,
      details,
      metadata: { source: 'web' }
    })
  }

  async logEntityUpdate<T extends Record<string, any>>(
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string,
    oldEntity: T,
    newEntity: T,
    userId: string,
    userName: string,
    userRole: string,
    organizationId: string
  ) {
    const changes = this.service.detectChanges(oldEntity, newEntity)
    
    return this.service.logActivity({
      type: 'UPDATE',
      entityType,
      entityId,
      entityName,
      userId,
      userName,
      userRole,
      organizationId,
      description: `Updated ${entityType?.toLowerCase()} "${entityName}"`,
      changes,
      metadata: { source: 'web' }
    })
  }

  async logEntityDelete(
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    userRole: string,
    organizationId: string
  ) {
    return this.service.logActivity({
      type: 'DELETE',
      entityType,
      entityId,
      entityName,
      userId,
      userName,
      userRole,
      organizationId,
      description: `Deleted ${entityType?.toLowerCase()} "${entityName}"`,
      metadata: { source: 'web' }
    })
  }

  async logDealMove(
    dealId: string,
    dealName: string,
    fromStage: string,
    toStage: string,
    pipelineName: string,
    userId: string,
    userName: string,
    userRole: string,
    organizationId: string
  ) {
    return this.service.logActivity({
      type: 'MOVE',
      entityType: 'Deal',
      entityId: dealId,
      entityName: dealName,
      userId,
      userName,
      userRole,
      organizationId,
      description: `Moved deal "${dealName}" from "${fromStage}" to "${toStage}"`,
      details: {
        fromStage,
        toStage,
        pipelineName
      },
      metadata: { source: 'web' }
    })
  }

  async logLeadConvert(
    leadId: string,
    leadName: string,
    dealId: string,
    dealValue: number,
    userId: string,
    userName: string,
    userRole: string,
    organizationId: string
  ) {
    return this.service.logActivity({
      type: 'CONVERT',
      entityType: 'Lead',
      entityId: leadId,
      entityName: leadName,
      userId,
      userName,
      userRole,
      organizationId,
      description: `Converted lead "${leadName}" to deal (${dealValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`,
      details: {
        createdDealId: dealId,
        dealValue
      },
      metadata: { source: 'web' }
    })
  }
}

// Global activity logger instance
export const activityLogger = new ActivityLogger(activityService)