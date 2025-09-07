/**
 * Enhanced Persistence - Stubbed Version
 * 
 * Provides basic persistence capabilities without file system operations
 * to avoid Node.js server/client compatibility issues
 */

export interface TrackableData {
  id: string;
}

export interface ValidationIssue {
  type: 'VALIDATION' | 'REFERENCE' | 'DUPLICATE' | 'ORPHAN';
  entityType: string;
  entityId: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SyncStatus {
  lastSync?: string;
  pendingChanges?: any[];
  conflicts?: string[];
}

export class EnhancedPersistence {
  private data = new Map<string, any[]>();
  
  async initialize(): Promise<void> {
    console.warn('Enhanced persistence features are disabled - using in-memory storage only');
  }
  
  async save<T>(entityType: string, data: T[], author?: string): Promise<void> {
    this.data.set(entityType, [...data]);
  }
  
  async load<T>(entityType: string): Promise<T[]> {
    return this.data.get(entityType) || [];
  }
  
  async validateData<T extends TrackableData>(entityType: string, data: T[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // Basic validation - check for duplicates
    const ids = data.map(item => item.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    duplicates.forEach(id => {
      issues.push({
        type: 'DUPLICATE',
        entityType,
        entityId: id,
        message: `Duplicate ID found: ${id}`,
        severity: 'HIGH'
      });
    });
    
    return issues;
  }
  
  async getChangeHistory(entityType: string, entityId?: string): Promise<any[]> {
    return [];
  }
  
  async getSyncStatus(): Promise<SyncStatus> {
    return {
      lastSync: new Date().toISOString(),
      pendingChanges: [],
      conflicts: []
    };
  }
  
  async backup(backupName?: string): Promise<string> {
    return `backup-${backupName || 'auto'}-${Date.now()}`;
  }
  
  async restore(backupPath: string): Promise<void> {
    console.warn('Restore operation not supported in stub implementation');
  }
  
  async getMetrics(): Promise<any> {
    return {
      totalEntities: Array.from(this.data.keys()).reduce((sum, key) => 
        sum + (this.data.get(key)?.length || 0), 0),
      entityTypes: Array.from(this.data.keys()),
      lastActivity: new Date().toISOString()
    };
  }
}

export const createEnhancedPersistence = (): EnhancedPersistence => {
  return new EnhancedPersistence();
};