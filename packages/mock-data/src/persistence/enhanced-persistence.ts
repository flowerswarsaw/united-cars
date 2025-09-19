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

export interface PersistenceConfig {
  dataDirectory: string;
  enableVersioning: boolean;
  maxVersions: number;
  enableBackups: boolean;
  backupInterval: number; // minutes
  enableChangeTracking: boolean;
  enableCrossSystemSync: boolean;
}

export class EnhancedPersistence {
  private data = new Map<string, any[]>();
  private config: PersistenceConfig;
  
  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      dataDirectory: './data',
      enableVersioning: false,
      maxVersions: 10,
      enableBackups: false,
      backupInterval: 60,
      enableChangeTracking: false,
      enableCrossSystemSync: false,
      ...config
    };
  }
  
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

  // Additional methods required by persistence-service-factory
  async validateDataIntegrity(): Promise<{ valid: boolean; issues: ValidationIssue[] }> {
    return { valid: true, issues: [] };
  }

  async createBackup(description?: string): Promise<string> {
    const backupName = `backup-${Date.now()}`;
    console.warn(`Backup creation stubbed: ${backupName}`);
    return backupName;
  }

  async syncWithUnifiedSystem(unifiedService: any): Promise<SyncStatus> {
    return {
      lastSync: new Date().toISOString(),
      pendingChanges: [],
      conflicts: []
    };
  }

  async loadVersion<T>(entityType: string, version: number): Promise<T[]> {
    return this.load<T>(entityType);
  }

  async listBackups(): Promise<any[]> {
    return [];
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    console.warn(`Backup restore stubbed: ${backupPath}`);
  }

  async getStats(): Promise<any> {
    return this.getMetrics();
  }
}

export const createEnhancedPersistence = (config?: Partial<PersistenceConfig>): EnhancedPersistence => {
  return new EnhancedPersistence(config);
};