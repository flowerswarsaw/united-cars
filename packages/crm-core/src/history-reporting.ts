import { HistoryEntry, historyLogger } from './history';
import { HistoryAnalyticsEngine } from './history-analytics';
import { RBACUser } from './rbac';

// Report types and configurations
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, {
    type: 'string' | 'number' | 'date' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
    default?: any;
  }>;
  requiredRole?: string;
  format: 'json' | 'csv' | 'html' | 'pdf';
}

export interface ReportResult {
  reportId: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  parameters: Record<string, any>;
  data: any;
  summary?: {
    totalRecords: number;
    timeRange?: string;
    keyInsights?: string[];
  };
  metadata?: {
    executionTime: number;
    dataSource: string;
    version: string;
  };
}

// Built-in report configurations
export const REPORT_CONFIGS: Record<string, ReportConfig> = {
  AUDIT_TRAIL: {
    id: 'AUDIT_TRAIL',
    name: 'Audit Trail Report',
    description: 'Complete audit trail for entity changes with detailed history',
    parameters: {
      entityType: {
        type: 'select',
        required: false,
        options: ['organisations', 'contacts', 'deals', 'leads', 'all'],
        default: 'all'
      },
      entityId: {
        type: 'string',
        required: false
      },
      userId: {
        type: 'string',
        required: false
      },
      fromDate: {
        type: 'date',
        required: false
      },
      toDate: {
        type: 'date',
        required: false
      },
      operations: {
        type: 'select',
        required: false,
        options: ['CREATE', 'UPDATE', 'DELETE', 'all'],
        default: 'all'
      }
    },
    format: 'html'
  },

  USER_ACTIVITY: {
    id: 'USER_ACTIVITY',
    name: 'User Activity Report',
    description: 'Detailed user activity analysis with productivity metrics',
    parameters: {
      userId: {
        type: 'string',
        required: false
      },
      fromDate: {
        type: 'date',
        required: true
      },
      toDate: {
        type: 'date',
        required: true
      },
      includeDetails: {
        type: 'boolean',
        required: false,
        default: true
      }
    },
    format: 'html'
  },

  SYSTEM_ACTIVITY: {
    id: 'SYSTEM_ACTIVITY',
    name: 'System Activity Dashboard',
    description: 'Overall system activity with trends and patterns',
    parameters: {
      period: {
        type: 'select',
        required: true,
        options: ['24h', '7d', '30d', '90d'],
        default: '7d'
      },
      entityTypes: {
        type: 'select',
        required: false,
        options: ['organisations', 'contacts', 'deals', 'leads', 'all'],
        default: 'all'
      }
    },
    format: 'html'
  },

  SECURITY_AUDIT: {
    id: 'SECURITY_AUDIT',
    name: 'Security Audit Report',
    description: 'Security-focused audit with suspicious activity detection',
    parameters: {
      fromDate: {
        type: 'date',
        required: true
      },
      toDate: {
        type: 'date',
        required: true
      },
      severity: {
        type: 'select',
        required: false,
        options: ['LOW', 'MEDIUM', 'HIGH', 'all'],
        default: 'all'
      }
    },
    requiredRole: 'admin',
    format: 'html'
  },

  COMPLIANCE_REPORT: {
    id: 'COMPLIANCE_REPORT',
    name: 'Compliance Report',
    description: 'Data access and modification compliance tracking',
    parameters: {
      fromDate: {
        type: 'date',
        required: true
      },
      toDate: {
        type: 'date',
        required: true
      },
      entityType: {
        type: 'select',
        required: false,
        options: ['organisations', 'contacts', 'deals', 'leads', 'all'],
        default: 'all'
      }
    },
    requiredRole: 'admin',
    format: 'csv'
  },

  CHANGE_SUMMARY: {
    id: 'CHANGE_SUMMARY',
    name: 'Change Summary Report',
    description: 'Summary of changes by field, user, and time period',
    parameters: {
      period: {
        type: 'select',
        required: true,
        options: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      entityType: {
        type: 'select',
        required: false,
        options: ['organisations', 'contacts', 'deals', 'leads', 'all'],
        default: 'all'
      }
    },
    format: 'json'
  }
};

export class HistoryReportingEngine {
  
  // Generate report based on configuration and parameters
  static async generateReport(
    reportId: string,
    parameters: Record<string, any>,
    user: RBACUser
  ): Promise<ReportResult> {
    const startTime = Date.now();
    const config = REPORT_CONFIGS[reportId];
    
    if (!config) {
      throw new Error(`Report configuration not found: ${reportId}`);
    }

    // Check permissions
    if (config.requiredRole && user.role !== config.requiredRole && user.role !== 'admin') {
      throw new Error(`Insufficient permissions for report: ${reportId}`);
    }

    // Validate parameters
    const validatedParams = this.validateParameters(config.parameters, parameters);

    // Generate report data
    let reportData: any;
    let summary: any;

    switch (reportId) {
      case 'AUDIT_TRAIL':
        ({ reportData, summary } = await this.generateAuditTrailReport(validatedParams));
        break;
      case 'USER_ACTIVITY':
        ({ reportData, summary } = await this.generateUserActivityReport(validatedParams));
        break;
      case 'SYSTEM_ACTIVITY':
        ({ reportData, summary } = await this.generateSystemActivityReport(validatedParams));
        break;
      case 'SECURITY_AUDIT':
        ({ reportData, summary } = await this.generateSecurityAuditReport(validatedParams));
        break;
      case 'COMPLIANCE_REPORT':
        ({ reportData, summary } = await this.generateComplianceReport(validatedParams));
        break;
      case 'CHANGE_SUMMARY':
        ({ reportData, summary } = await this.generateChangeSummaryReport(validatedParams));
        break;
      default:
        throw new Error(`Report generator not implemented: ${reportId}`);
    }

    const executionTime = Date.now() - startTime;

    return {
      reportId,
      title: config.name,
      generatedAt: new Date(),
      generatedBy: user.id,
      parameters: validatedParams,
      data: reportData,
      summary,
      metadata: {
        executionTime,
        dataSource: 'Enhanced CRM History Log',
        version: '2.0.0'
      }
    };
  }

  // Validate report parameters against configuration
  private static validateParameters(
    configParams: ReportConfig['parameters'],
    inputParams: Record<string, any>
  ): Record<string, any> {
    const validated: Record<string, any> = {};

    for (const [key, config] of Object.entries(configParams)) {
      const value = inputParams[key];

      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Required parameter missing: ${key}`);
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type validation
        switch (config.type) {
          case 'date':
            validated[key] = new Date(value);
            if (isNaN(validated[key].getTime())) {
              throw new Error(`Invalid date format for parameter: ${key}`);
            }
            break;
          case 'number':
            validated[key] = Number(value);
            if (isNaN(validated[key])) {
              throw new Error(`Invalid number format for parameter: ${key}`);
            }
            break;
          case 'boolean':
            validated[key] = Boolean(value);
            break;
          case 'select':
            if (config.options && !config.options.includes(value)) {
              throw new Error(`Invalid option for parameter ${key}: ${value}`);
            }
            validated[key] = value;
            break;
          default:
            validated[key] = String(value);
        }
      } else if (config.default !== undefined) {
        validated[key] = config.default;
      }
    }

    return validated;
  }

  // Generate audit trail report
  private static async generateAuditTrailReport(params: Record<string, any>) {
    const query: any = {};
    
    if (params.entityType && params.entityType !== 'all') {
      query.entityType = params.entityType;
    }
    if (params.entityId) {
      query.entityId = params.entityId;
    }
    if (params.userId) {
      query.userId = params.userId;
    }
    if (params.fromDate) {
      query.fromDate = params.fromDate;
    }
    if (params.toDate) {
      query.toDate = params.toDate;
    }
    if (params.operations && params.operations !== 'all') {
      query.operation = params.operations;
    }

    const entries = historyLogger.getHistory(query);
    
    // Group by entity
    const entitiesByType: Record<string, Record<string, HistoryEntry[]>> = {};
    
    for (const entry of entries) {
      if (!entitiesByType[entry.entityType]) {
        entitiesByType[entry.entityType] = {};
      }
      if (!entitiesByType[entry.entityType][entry.entityId]) {
        entitiesByType[entry.entityType][entry.entityId] = [];
      }
      entitiesByType[entry.entityType][entry.entityId].push(entry);
    }

    // Calculate summary statistics
    const totalEntities = Object.values(entitiesByType).reduce(
      (sum, entities) => sum + Object.keys(entities).length, 
      0
    );
    
    const operationCounts = entries.reduce((counts: Record<string, number>, entry) => {
      counts[entry.operation] = (counts[entry.operation] || 0) + 1;
      return counts;
    }, {});

    const reportData = {
      entries,
      entitiesByType,
      totalRecords: entries.length,
      totalEntities,
      operationCounts,
      timeRange: params.fromDate && params.toDate 
        ? `${params.fromDate.toISOString().split('T')[0]} to ${params.toDate.toISOString().split('T')[0]}`
        : 'All time'
    };

    const summary = {
      totalRecords: entries.length,
      timeRange: reportData.timeRange,
      keyInsights: [
        `${totalEntities} unique entities tracked`,
        `Most common operation: ${Object.entries(operationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}`,
        `Average changes per entity: ${totalEntities > 0 ? Math.round(entries.length / totalEntities) : 0}`
      ]
    };

    return { reportData, summary };
  }

  // Generate user activity report
  private static async generateUserActivityReport(params: Record<string, any>) {
    const userId = params.userId;
    const dateRange = {
      from: params.fromDate,
      to: params.toDate
    };

    if (userId) {
      // Single user report
      const activityReport = HistoryAnalyticsEngine.generateUserActivityReport(userId, dateRange);
      
      const reportData = {
        userReport: activityReport,
        type: 'single_user'
      };

      const summary = {
        totalRecords: activityReport.summary.totalActions,
        timeRange: `${dateRange.from.toISOString().split('T')[0]} to ${dateRange.to.toISOString().split('T')[0]}`,
        keyInsights: [
          `${activityReport.summary.totalActions} total actions`,
          `${activityReport.summary.entitiesModified} entities modified`,
          `Most active day: ${activityReport.summary.mostActiveDay}`,
          `Average ${Math.round(activityReport.summary.averageActionsPerDay)} actions per day`
        ]
      };

      return { reportData, summary };
    } else {
      // All users report
      const entries = historyLogger.getHistory({
        fromDate: dateRange.from,
        toDate: dateRange.to
      });

      const analytics = await HistoryAnalyticsEngine.generateAnalytics(dateRange);
      
      const reportData = {
        analytics,
        type: 'all_users'
      };

      const summary = {
        totalRecords: entries.length,
        timeRange: `${dateRange.from.toISOString().split('T')[0]} to ${dateRange.to.toISOString().split('T')[0]}`,
        keyInsights: [
          `${analytics.userActivity.mostActiveUsers.length} active users`,
          `Most active user: ${analytics.userActivity.mostActiveUsers[0]?.userId || 'N/A'}`,
          `Peak activity hour: ${analytics.timeAnalytics.activityByHour.reduce((max, curr) => curr.count > max.count ? curr : max).hour}:00`
        ]
      };

      return { reportData, summary };
    }
  }

  // Generate system activity report
  private static async generateSystemActivityReport(params: Record<string, any>) {
    const period = params.period;
    const entityTypes = params.entityTypes === 'all' ? undefined : [params.entityTypes];
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const dateRange = { from: startDate, to: endDate };
    const analytics = await HistoryAnalyticsEngine.generateAnalytics(dateRange, entityTypes);
    
    const reportData = {
      analytics,
      period,
      entityTypes: entityTypes || ['all']
    };

    const totalOperations = Object.values(analytics.operationAnalytics.operationFrequency)
      .reduce((sum, count) => sum + count, 0);

    const summary = {
      totalRecords: totalOperations,
      timeRange: `${period} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
      keyInsights: [
        `${analytics.userActivity.mostActiveUsers.length} active users`,
        `${Object.keys(analytics.entityActivity.entityTypeBreakdown).length} entity types modified`,
        `${analytics.securityAnalytics.suspiciousActivity.length} security alerts`,
        `Peak activity: ${analytics.timeAnalytics.peakActivityTimes[0]?.period || 'N/A'}`
      ]
    };

    return { reportData, summary };
  }

  // Generate security audit report
  private static async generateSecurityAuditReport(params: Record<string, any>) {
    const dateRange = {
      from: params.fromDate,
      to: params.toDate
    };
    
    const analytics = await HistoryAnalyticsEngine.generateAnalytics(dateRange);
    let suspiciousActivity = analytics.securityAnalytics.suspiciousActivity;
    
    if (params.severity && params.severity !== 'all') {
      suspiciousActivity = suspiciousActivity.filter(activity => 
        activity.severity === params.severity
      );
    }

    const reportData = {
      suspiciousActivity,
      accessPatterns: analytics.securityAnalytics.accessPatterns,
      timeRange: dateRange
    };

    const highRiskCount = suspiciousActivity.filter(a => a.severity === 'HIGH').length;
    const mediumRiskCount = suspiciousActivity.filter(a => a.severity === 'MEDIUM').length;

    const summary = {
      totalRecords: suspiciousActivity.length,
      timeRange: `${dateRange.from.toISOString().split('T')[0]} to ${dateRange.to.toISOString().split('T')[0]}`,
      keyInsights: [
        `${highRiskCount} high-risk activities`,
        `${mediumRiskCount} medium-risk activities`,
        `${analytics.securityAnalytics.accessPatterns.length} unique access patterns`,
        suspiciousActivity.length === 0 ? 'No suspicious activity detected' : 'Security review recommended'
      ]
    };

    return { reportData, summary };
  }

  // Generate compliance report
  private static async generateComplianceReport(params: Record<string, any>) {
    const query: any = {
      fromDate: params.fromDate,
      toDate: params.toDate
    };
    
    if (params.entityType && params.entityType !== 'all') {
      query.entityType = params.entityType;
    }

    const entries = historyLogger.getHistory(query);
    
    // Structure for compliance export
    const complianceData = entries.map(entry => ({
      timestamp: entry.timestamp.toISOString(),
      entityType: entry.entityType,
      entityId: entry.entityId,
      operation: entry.operation,
      userId: entry.userId,
      userName: entry.userName || entry.userId,
      changedFields: entry.changedFields?.join(', ') || '',
      ipAddress: entry.ipAddress || '',
      userAgent: entry.userAgent || '',
      reason: entry.reason || '',
      checksum: entry.checksum
    }));

    const reportData = {
      complianceEntries: complianceData,
      integrityCheck: historyLogger.verifyIntegrity()
    };

    const summary = {
      totalRecords: entries.length,
      timeRange: `${params.fromDate.toISOString().split('T')[0]} to ${params.toDate.toISOString().split('T')[0]}`,
      keyInsights: [
        `${entries.length} auditable events`,
        `Data integrity: ${reportData.integrityCheck.valid ? 'Valid' : 'Issues detected'}`,
        `Entities tracked: ${new Set(entries.map(e => e.entityType)).size} types`,
        `Users involved: ${new Set(entries.map(e => e.userId)).size}`
      ]
    };

    return { reportData, summary };
  }

  // Generate change summary report
  private static async generateChangeSummaryReport(params: Record<string, any>) {
    const period = params.period;
    const entityType = params.entityType;
    
    // Calculate appropriate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 84); // Last 12 weeks
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
        break;
    }

    const query: any = {
      fromDate: startDate,
      toDate: endDate
    };
    
    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    const entries = historyLogger.getHistory(query);
    
    // Group by time period
    const periodData = new Map<string, {
      creates: number;
      updates: number;
      deletes: number;
      fieldChanges: Map<string, number>;
    }>();

    for (const entry of entries) {
      let periodKey: string;
      
      switch (period) {
        case 'daily':
          periodKey = entry.timestamp.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(entry.timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = entry.timestamp.toISOString().substring(0, 7); // YYYY-MM
          break;
        default:
          periodKey = entry.timestamp.toISOString().split('T')[0];
      }

      const data = periodData.get(periodKey) || {
        creates: 0,
        updates: 0,
        deletes: 0,
        fieldChanges: new Map()
      };

      switch (entry.operation) {
        case 'CREATE':
          data.creates++;
          break;
        case 'UPDATE':
          data.updates++;
          break;
        case 'DELETE':
          data.deletes++;
          break;
      }

      if (entry.changedFields) {
        for (const field of entry.changedFields) {
          data.fieldChanges.set(field, (data.fieldChanges.get(field) || 0) + 1);
        }
      }

      periodData.set(periodKey, data);
    }

    // Convert to array format
    const summaryByPeriod = Array.from(periodData.entries())
      .map(([period, data]) => ({
        period,
        creates: data.creates,
        updates: data.updates,
        deletes: data.deletes,
        total: data.creates + data.updates + data.deletes,
        topChangedFields: Array.from(data.fieldChanges.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([field, count]) => ({ field, count }))
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const reportData = {
      summaryByPeriod,
      period,
      entityType: entityType || 'all'
    };

    const totalChanges = summaryByPeriod.reduce((sum, p) => sum + p.total, 0);

    const summary = {
      totalRecords: totalChanges,
      timeRange: `${period} summary (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`,
      keyInsights: [
        `${summaryByPeriod.length} ${period} periods analyzed`,
        `Average changes per ${period.slice(0, -2)}: ${Math.round(totalChanges / summaryByPeriod.length)}`,
        `Most active period: ${summaryByPeriod.reduce((max, curr) => curr.total > max.total ? curr : max).period}`,
        `Primary operation: ${entries.reduce((counts: Record<string, number>, e) => {
          counts[e.operation] = (counts[e.operation] || 0) + 1;
          return counts;
        }, {})} → ${Object.entries(entries.reduce((counts: Record<string, number>, e) => {
          counts[e.operation] = (counts[e.operation] || 0) + 1;
          return counts;
        }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}`
      ]
    };

    return { reportData, summary };
  }

  // Get available reports for user role
  static getAvailableReports(userRole: string): ReportConfig[] {
    return Object.values(REPORT_CONFIGS).filter(config => 
      !config.requiredRole || 
      config.requiredRole === userRole || 
      userRole === 'admin'
    );
  }
}

// Export utility functions
export const historyReportingUtils = {
  
  // Quick reports for common use cases
  generateQuickAuditReport: async (entityType: string, entityId: string, user: RBACUser) => {
    return HistoryReportingEngine.generateReport('AUDIT_TRAIL', {
      entityType,
      entityId,
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      toDate: new Date()
    }, user);
  },

  generateQuickUserReport: async (userId: string, days: number, user: RBACUser) => {
    return HistoryReportingEngine.generateReport('USER_ACTIVITY', {
      userId,
      fromDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      toDate: new Date()
    }, user);
  },

  generateSystemHealthReport: async (user: RBACUser) => {
    return HistoryReportingEngine.generateReport('SYSTEM_ACTIVITY', {
      period: '7d',
      entityTypes: 'all'
    }, user);
  }
};