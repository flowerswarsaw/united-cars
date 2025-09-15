export interface HistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changedFields?: string[];
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  userId: string;
  userName?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string; // Optional reason for the change
  checksum: string; // Tamper-proof hash
}

export interface HistoryQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  operation?: HistoryEntry['operation'];
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EntityHistorySnapshot {
  entityId: string;
  entityType: string;
  snapshots: Array<{
    timestamp: Date;
    data: Record<string, any>;
    operation: string;
    userId: string;
    userName?: string;
  }>;
}

export class HistoryLogger {
  private entries = new Map<string, HistoryEntry>();
  private nextId = 1;

  // Create a tamper-proof checksum for the entry
  private createChecksum(entry: Omit<HistoryEntry, 'checksum'>): string {
    const data = {
      entityType: entry.entityType,
      entityId: entry.entityId,
      operation: entry.operation,
      changedFields: entry.changedFields,
      beforeData: entry.beforeData,
      afterData: entry.afterData,
      userId: entry.userId,
      timestamp: entry.timestamp.toISOString()
    };
    
    // Simple hash function for demo - in production use crypto.createHash
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  // Verify entry hasn't been tampered with
  private verifyChecksum(entry: HistoryEntry): boolean {
    const expectedChecksum = this.createChecksum({
      ...entry,
      checksum: ''
    });
    return entry.checksum === expectedChecksum;
  }

  // Log a history entry
  logEntry(
    entityType: string,
    entityId: string,
    operation: HistoryEntry['operation'],
    userId: string,
    options: {
      changedFields?: string[];
      beforeData?: Record<string, any>;
      afterData?: Record<string, any>;
      userName?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    } = {}
  ): HistoryEntry {
    const entryData: Omit<HistoryEntry, 'id' | 'checksum'> = {
      entityType,
      entityId,
      operation,
      userId,
      timestamp: new Date(),
      ...options
    };

    const entry: HistoryEntry = {
      id: `hist_${this.nextId++}`,
      ...entryData,
      checksum: this.createChecksum(entryData)
    };

    this.entries.set(entry.id, entry);
    return entry;
  }

  // Get history entries with optional filtering
  getHistory(query: HistoryQuery = {}): HistoryEntry[] {
    let results = Array.from(this.entries.values());

    // Apply filters
    if (query.entityType) {
      results = results.filter(entry => entry.entityType === query.entityType);
    }
    if (query.entityId) {
      results = results.filter(entry => entry.entityId === query.entityId);
    }
    if (query.userId) {
      results = results.filter(entry => entry.userId === query.userId);
    }
    if (query.operation) {
      results = results.filter(entry => entry.operation === query.operation);
    }
    if (query.fromDate) {
      results = results.filter(entry => entry.timestamp >= query.fromDate!);
    }
    if (query.toDate) {
      results = results.filter(entry => entry.timestamp <= query.toDate!);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // Get complete history for a specific entity
  getEntityHistory(entityType: string, entityId: string): EntityHistorySnapshot {
    const entries = this.getHistory({ entityType, entityId });
    
    return {
      entityId,
      entityType,
      snapshots: entries.map(entry => ({
        timestamp: entry.timestamp,
        data: entry.afterData || entry.beforeData || {},
        operation: entry.operation,
        userId: entry.userId,
        userName: entry.userName
      }))
    };
  }

  // Reconstruct entity state at a specific point in time
  reconstructEntityAt(entityType: string, entityId: string, timestamp: Date): Record<string, any> | null {
    const entries = this.getHistory({ entityType, entityId })
      .filter(entry => entry.timestamp <= timestamp)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (entries.length === 0) return null;

    let reconstructedState: Record<string, any> = {};

    for (const entry of entries) {
      if (entry.operation === 'CREATE') {
        reconstructedState = entry.afterData || {};
      } else if (entry.operation === 'UPDATE') {
        reconstructedState = { ...reconstructedState, ...(entry.afterData || {}) };
      } else if (entry.operation === 'DELETE') {
        return null; // Entity was deleted at this point
      } else if (entry.operation === 'RESTORE') {
        reconstructedState = entry.afterData || reconstructedState;
      }
    }

    return reconstructedState;
  }

  // Verify integrity of all entries
  verifyIntegrity(): { valid: boolean; corruptedEntries: string[] } {
    const corruptedEntries: string[] = [];

    for (const entry of this.entries.values()) {
      if (!this.verifyChecksum(entry)) {
        corruptedEntries.push(entry.id);
      }
    }

    return {
      valid: corruptedEntries.length === 0,
      corruptedEntries
    };
  }

  // Get activity summary for an entity
  getActivitySummary(entityType: string, entityId: string): {
    totalChanges: number;
    lastModified?: Date;
    lastModifiedBy?: { userId: string; userName?: string };
    operations: Record<string, number>;
    frequentFields: Array<{ field: string; count: number }>;
  } {
    const entries = this.getHistory({ entityType, entityId });
    
    const operations: Record<string, number> = {};
    const fieldCounts: Record<string, number> = {};
    
    let lastModified: Date | undefined;
    let lastModifiedBy: { userId: string; userName?: string } | undefined;

    for (const entry of entries) {
      // Count operations
      operations[entry.operation] = (operations[entry.operation] || 0) + 1;
      
      // Track field changes
      if (entry.changedFields) {
        for (const field of entry.changedFields) {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        }
      }
      
      // Track most recent change
      if (!lastModified || entry.timestamp > lastModified) {
        lastModified = entry.timestamp;
        lastModifiedBy = { userId: entry.userId, userName: entry.userName };
      }
    }

    const frequentFields = Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalChanges: entries.length,
      lastModified,
      lastModifiedBy,
      operations,
      frequentFields
    };
  }

  // Serialize for persistence
  toJSON(): HistoryEntry[] {
    return Array.from(this.entries.values());
  }

  // Deserialize from persistence
  fromJSON(data: HistoryEntry[]): void {
    this.entries.clear();
    let maxId = 0;
    
    data.forEach(entry => {
      // Convert date strings back to Date objects
      if (typeof entry.timestamp === 'string') {
        entry.timestamp = new Date(entry.timestamp);
      }
      
      // Track highest ID for next ID generation
      const idNumber = parseInt(entry.id.replace('hist_', ''));
      if (!isNaN(idNumber) && idNumber > maxId) {
        maxId = idNumber;
      }
      
      this.entries.set(entry.id, entry);
    });
    
    this.nextId = maxId + 1;
  }

  // Clear all history
  clear(): void {
    this.entries.clear();
    this.nextId = 1;
  }

  // Get statistics
  getStatistics(): {
    totalEntries: number;
    entitiesCovered: number;
    operationBreakdown: Record<string, number>;
    entityTypeBreakdown: Record<string, number>;
    recentActivity: { date: string; count: number }[];
  } {
    const entries = Array.from(this.entries.values());
    
    const operationBreakdown: Record<string, number> = {};
    const entityTypeBreakdown: Record<string, number> = {};
    const uniqueEntities = new Set<string>();
    const dailyActivity: Record<string, number> = {};

    for (const entry of entries) {
      // Count operations
      operationBreakdown[entry.operation] = (operationBreakdown[entry.operation] || 0) + 1;
      
      // Count entity types
      entityTypeBreakdown[entry.entityType] = (entityTypeBreakdown[entry.entityType] || 0) + 1;
      
      // Track unique entities
      uniqueEntities.add(`${entry.entityType}:${entry.entityId}`);
      
      // Track daily activity
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
    }

    const recentActivity = Object.entries(dailyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30); // Last 30 days

    return {
      totalEntries: entries.length,
      entitiesCovered: uniqueEntities.size,
      operationBreakdown,
      entityTypeBreakdown,
      recentActivity
    };
  }
}

// Global history logger instance
export const historyLogger = new HistoryLogger();