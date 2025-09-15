import { HistoryEntry, HistoryQuery, historyLogger } from './history';
import { RBACUser } from './rbac';

// Advanced analytics for history data
export interface HistoryAnalytics {
  // Entity analytics
  entityActivity: {
    mostActiveEntities: Array<{
      entityType: string;
      entityId: string;
      totalChanges: number;
      lastActivity: Date;
    }>;
    entityTypeBreakdown: Record<string, {
      totalEntities: number;
      totalChanges: number;
      averageChangesPerEntity: number;
    }>;
  };

  // User analytics  
  userActivity: {
    mostActiveUsers: Array<{
      userId: string;
      userName?: string;
      totalActions: number;
      lastActivity: Date;
      operationBreakdown: Record<string, number>;
    }>;
    userEfficiency: Array<{
      userId: string;
      userName?: string;
      actionsPerDay: number;
      errorRate: number;
    }>;
  };

  // Time-based analytics
  timeAnalytics: {
    activityByHour: Array<{ hour: number; count: number }>;
    activityByDay: Array<{ date: string; count: number }>;
    activityByMonth: Array<{ month: string; count: number }>;
    peakActivityTimes: Array<{
      period: string;
      count: number;
      description: string;
    }>;
  };

  // Operation analytics
  operationAnalytics: {
    operationFrequency: Record<string, number>;
    operationTrends: Array<{
      operation: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      changePercent: number;
    }>;
    errorOperations: Array<{
      operation: string;
      errorCount: number;
      successRate: number;
    }>;
  };

  // Field change analytics
  fieldAnalytics: {
    mostChangedFields: Array<{
      field: string;
      changeCount: number;
      entityTypes: string[];
    }>;
    fieldChangePatterns: Array<{
      field: string;
      pattern: string;
      frequency: number;
    }>;
  };

  // Security analytics
  securityAnalytics: {
    suspiciousActivity: Array<{
      type: 'bulk_operations' | 'after_hours' | 'rapid_changes' | 'permission_escalation';
      description: string;
      userId: string;
      timestamp: Date;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    accessPatterns: Array<{
      userId: string;
      ipAddress: string;
      userAgent: string;
      sessionCount: number;
      lastAccess: Date;
    }>;
  };
}

export class HistoryAnalyticsEngine {
  
  // Generate comprehensive analytics from history data
  static async generateAnalytics(
    dateRange?: { from: Date; to: Date },
    entityTypes?: string[],
    userIds?: string[]
  ): Promise<HistoryAnalytics> {
    
    // Build query
    const query: HistoryQuery = {};
    if (dateRange) {
      query.fromDate = dateRange.from;
      query.toDate = dateRange.to;
    }

    // Get all relevant history entries
    let entries = historyLogger.getHistory(query);

    // Apply additional filters
    if (entityTypes && entityTypes.length > 0) {
      entries = entries.filter(entry => entityTypes.includes(entry.entityType));
    }
    if (userIds && userIds.length > 0) {
      entries = entries.filter(entry => userIds.includes(entry.userId));
    }

    // Generate analytics
    return {
      entityActivity: this.analyzeEntityActivity(entries),
      userActivity: this.analyzeUserActivity(entries),
      timeAnalytics: this.analyzeTimePatterns(entries),
      operationAnalytics: this.analyzeOperations(entries),
      fieldAnalytics: this.analyzeFieldChanges(entries),
      securityAnalytics: this.analyzeSecurityPatterns(entries)
    };
  }

  // Analyze entity activity patterns
  private static analyzeEntityActivity(entries: HistoryEntry[]) {
    const entityActivity = new Map<string, {
      totalChanges: number;
      lastActivity: Date;
    }>();

    const entityTypeStats = new Map<string, {
      entities: Set<string>;
      totalChanges: number;
    }>();

    for (const entry of entries) {
      const entityKey = `${entry.entityType}:${entry.entityId}`;
      
      // Track individual entity activity
      const current = entityActivity.get(entityKey) || {
        totalChanges: 0,
        lastActivity: entry.timestamp
      };
      
      current.totalChanges++;
      if (entry.timestamp > current.lastActivity) {
        current.lastActivity = entry.timestamp;
      }
      
      entityActivity.set(entityKey, current);

      // Track entity type stats
      const typeStats = entityTypeStats.get(entry.entityType) || {
        entities: new Set(),
        totalChanges: 0
      };
      
      typeStats.entities.add(entry.entityId);
      typeStats.totalChanges++;
      entityTypeStats.set(entry.entityType, typeStats);
    }

    // Convert to results format
    const mostActiveEntities = Array.from(entityActivity.entries())
      .map(([key, stats]) => {
        const [entityType, entityId] = key.split(':');
        return {
          entityType,
          entityId,
          totalChanges: stats.totalChanges,
          lastActivity: stats.lastActivity
        };
      })
      .sort((a, b) => b.totalChanges - a.totalChanges)
      .slice(0, 10);

    const entityTypeBreakdown: Record<string, any> = {};
    for (const [entityType, stats] of entityTypeStats.entries()) {
      entityTypeBreakdown[entityType] = {
        totalEntities: stats.entities.size,
        totalChanges: stats.totalChanges,
        averageChangesPerEntity: stats.totalChanges / stats.entities.size
      };
    }

    return {
      mostActiveEntities,
      entityTypeBreakdown
    };
  }

  // Analyze user activity patterns
  private static analyzeUserActivity(entries: HistoryEntry[]) {
    const userStats = new Map<string, {
      totalActions: number;
      lastActivity: Date;
      operations: Map<string, number>;
      dailyActions: Map<string, number>;
    }>();

    for (const entry of entries) {
      const user = userStats.get(entry.userId) || {
        totalActions: 0,
        lastActivity: entry.timestamp,
        operations: new Map(),
        dailyActions: new Map()
      };

      user.totalActions++;
      if (entry.timestamp > user.lastActivity) {
        user.lastActivity = entry.timestamp;
      }

      // Track operations
      const opCount = user.operations.get(entry.operation) || 0;
      user.operations.set(entry.operation, opCount + 1);

      // Track daily actions
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      const dayCount = user.dailyActions.get(dateKey) || 0;
      user.dailyActions.set(dateKey, dayCount + 1);

      userStats.set(entry.userId, user);
    }

    // Convert to results format
    const mostActiveUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        userName: userId, // Would be enriched with actual user names
        totalActions: stats.totalActions,
        lastActivity: stats.lastActivity,
        operationBreakdown: Object.fromEntries(stats.operations.entries())
      }))
      .sort((a, b) => b.totalActions - a.totalActions)
      .slice(0, 10);

    const userEfficiency = Array.from(userStats.entries())
      .map(([userId, stats]) => {
        const totalDays = stats.dailyActions.size;
        const actionsPerDay = totalDays > 0 ? stats.totalActions / totalDays : 0;
        
        return {
          userId,
          userName: userId,
          actionsPerDay,
          errorRate: 0 // Would calculate from error tracking
        };
      })
      .sort((a, b) => b.actionsPerDay - a.actionsPerDay);

    return {
      mostActiveUsers,
      userEfficiency
    };
  }

  // Analyze time-based patterns
  private static analyzeTimePatterns(entries: HistoryEntry[]) {
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Map<string, number>();
    const monthlyActivity = new Map<string, number>();

    for (const entry of entries) {
      const hour = entry.timestamp.getHours();
      hourlyActivity[hour]++;

      const dateKey = entry.timestamp.toISOString().split('T')[0];
      dailyActivity.set(dateKey, (dailyActivity.get(dateKey) || 0) + 1);

      const monthKey = entry.timestamp.toISOString().substring(0, 7); // YYYY-MM
      monthlyActivity.set(monthKey, (monthlyActivity.get(monthKey) || 0) + 1);
    }

    const activityByHour = hourlyActivity.map((count, hour) => ({ hour, count }));
    
    const activityByDay = Array.from(dailyActivity.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const activityByMonth = Array.from(monthlyActivity.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Find peak activity times
    const peakHour = activityByHour.reduce((max, curr) => 
      curr.count > max.count ? curr : max
    );

    const peakActivityTimes = [
      {
        period: `${peakHour.hour}:00-${peakHour.hour + 1}:00`,
        count: peakHour.count,
        description: 'Peak hour activity'
      }
    ];

    return {
      activityByHour,
      activityByDay,
      activityByMonth,
      peakActivityTimes
    };
  }

  // Analyze operation patterns
  private static analyzeOperations(entries: HistoryEntry[]) {
    const operationCounts = new Map<string, number>();
    
    for (const entry of entries) {
      operationCounts.set(entry.operation, (operationCounts.get(entry.operation) || 0) + 1);
    }

    const operationFrequency = Object.fromEntries(operationCounts.entries());
    
    // For trends, we'd need historical data comparison
    const operationTrends = Array.from(operationCounts.entries())
      .map(([operation, count]) => ({
        operation,
        trend: 'stable' as const, // Would calculate from historical data
        changePercent: 0
      }));

    const errorOperations = Array.from(operationCounts.entries())
      .map(([operation, count]) => ({
        operation,
        errorCount: 0, // Would track from error logs
        successRate: 100
      }));

    return {
      operationFrequency,
      operationTrends,
      errorOperations
    };
  }

  // Analyze field change patterns
  private static analyzeFieldChanges(entries: HistoryEntry[]) {
    const fieldChanges = new Map<string, {
      count: number;
      entityTypes: Set<string>;
    }>();

    for (const entry of entries) {
      if (entry.changedFields) {
        for (const field of entry.changedFields) {
          const current = fieldChanges.get(field) || {
            count: 0,
            entityTypes: new Set()
          };
          
          current.count++;
          current.entityTypes.add(entry.entityType);
          fieldChanges.set(field, current);
        }
      }
    }

    const mostChangedFields = Array.from(fieldChanges.entries())
      .map(([field, stats]) => ({
        field,
        changeCount: stats.count,
        entityTypes: Array.from(stats.entityTypes)
      }))
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 10);

    // Field change patterns would be more complex in practice
    const fieldChangePatterns = mostChangedFields.map(field => ({
      field: field.field,
      pattern: 'frequent_updates',
      frequency: field.changeCount
    }));

    return {
      mostChangedFields,
      fieldChangePatterns
    };
  }

  // Analyze security patterns
  private static analyzeSecurityPatterns(entries: HistoryEntry[]) {
    const suspiciousActivity: Array<{
      type: 'bulk_operations' | 'after_hours' | 'rapid_changes' | 'permission_escalation';
      description: string;
      userId: string;
      timestamp: Date;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];

    const accessPatterns = new Map<string, {
      ipAddresses: Set<string>;
      userAgents: Set<string>;
      sessionCount: number;
      lastAccess: Date;
    }>();

    // Group entries by user and time windows
    const userTimeWindows = new Map<string, HistoryEntry[]>();
    
    for (const entry of entries) {
      const timeWindow = Math.floor(entry.timestamp.getTime() / (5 * 60 * 1000)); // 5-minute windows
      const key = `${entry.userId}:${timeWindow}`;
      
      if (!userTimeWindows.has(key)) {
        userTimeWindows.set(key, []);
      }
      userTimeWindows.get(key)!.push(entry);

      // Track access patterns
      const access = accessPatterns.get(entry.userId) || {
        ipAddresses: new Set(),
        userAgents: new Set(),
        sessionCount: 0,
        lastAccess: entry.timestamp
      };

      if (entry.ipAddress) access.ipAddresses.add(entry.ipAddress);
      if (entry.userAgent) access.userAgents.add(entry.userAgent);
      if (entry.timestamp > access.lastAccess) {
        access.lastAccess = entry.timestamp;
      }
      access.sessionCount++;

      accessPatterns.set(entry.userId, access);
    }

    // Detect bulk operations
    for (const [key, windowEntries] of userTimeWindows.entries()) {
      if (windowEntries.length > 20) { // More than 20 operations in 5 minutes
        const [userId] = key.split(':');
        suspiciousActivity.push({
          type: 'bulk_operations',
          description: `${windowEntries.length} operations in 5 minutes`,
          userId,
          timestamp: windowEntries[0].timestamp,
          severity: windowEntries.length > 50 ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    // Detect after-hours activity (outside 9-17)
    for (const entry of entries) {
      const hour = entry.timestamp.getHours();
      if (hour < 9 || hour > 17) {
        suspiciousActivity.push({
          type: 'after_hours',
          description: `Activity at ${hour}:00`,
          userId: entry.userId,
          timestamp: entry.timestamp,
          severity: 'LOW'
        });
      }
    }

    const accessPatternsArray = Array.from(accessPatterns.entries())
      .map(([userId, stats]) => ({
        userId,
        ipAddress: Array.from(stats.ipAddresses)[0] || '',
        userAgent: Array.from(stats.userAgents)[0] || '',
        sessionCount: stats.sessionCount,
        lastAccess: stats.lastAccess
      }));

    return {
      suspiciousActivity: suspiciousActivity.slice(0, 20), // Top 20
      accessPatterns: accessPatternsArray
    };
  }

  // Generate user activity report
  static generateUserActivityReport(
    userId: string,
    dateRange?: { from: Date; to: Date }
  ): {
    summary: {
      totalActions: number;
      entitiesModified: number;
      averageActionsPerDay: number;
      mostActiveDay: string;
    };
    recentActivity: HistoryEntry[];
    operationBreakdown: Record<string, number>;
    entityBreakdown: Record<string, number>;
    timelineActivity: Array<{ date: string; count: number }>;
  } {
    const query: HistoryQuery = { userId };
    if (dateRange) {
      query.fromDate = dateRange.from;
      query.toDate = dateRange.to;
    }

    const entries = historyLogger.getHistory(query);
    
    const entitiesModified = new Set(
      entries.map(e => `${e.entityType}:${e.entityId}`)
    ).size;

    const dailyActivity = new Map<string, number>();
    const operationCounts = new Map<string, number>();
    const entityTypeCounts = new Map<string, number>();

    for (const entry of entries) {
      // Daily activity
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      dailyActivity.set(dateKey, (dailyActivity.get(dateKey) || 0) + 1);

      // Operation counts
      operationCounts.set(entry.operation, (operationCounts.get(entry.operation) || 0) + 1);

      // Entity type counts
      entityTypeCounts.set(entry.entityType, (entityTypeCounts.get(entry.entityType) || 0) + 1);
    }

    const totalDays = dailyActivity.size;
    const averageActionsPerDay = totalDays > 0 ? entries.length / totalDays : 0;

    const mostActiveDay = Array.from(dailyActivity.entries())
      .reduce((max, current) => current[1] > max[1] ? current : max, ['', 0])[0];

    const timelineActivity = Array.from(dailyActivity.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalActions: entries.length,
        entitiesModified,
        averageActionsPerDay,
        mostActiveDay
      },
      recentActivity: entries.slice(0, 10), // Most recent 10
      operationBreakdown: Object.fromEntries(operationCounts.entries()),
      entityBreakdown: Object.fromEntries(entityTypeCounts.entries()),
      timelineActivity
    };
  }
}

// Export utility functions for common analytics tasks
export const historyAnalyticsUtils = {
  
  // Get audit trail for specific entity
  getEntityAuditTrail: (entityType: string, entityId: string): HistoryEntry[] => {
    return historyLogger.getHistory({ entityType, entityId });
  },

  // Get recent system activity
  getRecentActivity: (limit = 50): HistoryEntry[] => {
    return historyLogger.getHistory({ limit });
  },

  // Get activity for date range
  getActivityInRange: (from: Date, to: Date): HistoryEntry[] => {
    return historyLogger.getHistory({ fromDate: from, toDate: to });
  },

  // Check for suspicious patterns
  detectSuspiciousActivity: (hours = 24): Array<{
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }> => {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const entries = historyLogger.getHistory({ fromDate: since });
    
    const analytics = HistoryAnalyticsEngine.analyzeSecurityPatterns(entries);
    return analytics.suspiciousActivity.map(activity => ({
      type: activity.type,
      description: activity.description,
      severity: activity.severity
    }));
  }
};