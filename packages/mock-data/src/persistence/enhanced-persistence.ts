/**
 * Enhanced Mock Data Persistence System
 * 
 * Provides robust data persistence with:
 * - Cross-system synchronization between main and CRM data
 * - Versioning and conflict resolution
 * - Data integrity validation
 * - Backup and recovery capabilities
 * - Change tracking and audit logs
 */

import { writeFile, readFile, mkdir, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { 
  UnifiedOrganization, 
  UnifiedOrganizationService,
  transformMainOrgToUnified,
  transformCrmOrgToUnified 
} from '@united-cars/core';

export interface PersistenceConfig {
  dataDirectory: string;
  enableVersioning: boolean;
  maxVersions: number;
  enableBackups: boolean;
  backupInterval: number; // minutes
  enableChangeTracking: boolean;
  enableCrossSystemSync: boolean;
}

export interface DataVersion {
  version: number;
  timestamp: Date;
  checksum: string;
  changes: ChangeRecord[];
  author?: string;
  description?: string;
}

export interface ChangeRecord {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: Date;
  author?: string;
  metadata?: Record<string, any>;
}

export interface SyncStatus {
  lastSync: Date;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  conflictsResolved: number;
  errors: string[];
  itemsSynced: number;
}

export interface DataIntegrityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingReferences: number;
  duplicateRecords: number;
  issues: Array<{
    type: 'VALIDATION' | 'REFERENCE' | 'DUPLICATE' | 'ORPHAN';
    entityType: string;
    entityId: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}

export class EnhancedPersistence {
  private config: PersistenceConfig;
  private dataPath: string;
  private versionsPath: string;
  private backupsPath: string;
  private changesPath: string;
  private currentVersion: number = 1;
  private changeLog: ChangeRecord[] = [];

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      dataDirectory: './data',
      enableVersioning: true,
      maxVersions: 10,
      enableBackups: true,
      backupInterval: 60, // 1 hour
      enableChangeTracking: true,
      enableCrossSystemSync: true,
      ...config
    };

    this.dataPath = join(this.config.dataDirectory, 'current');
    this.versionsPath = join(this.config.dataDirectory, 'versions');
    this.backupsPath = join(this.config.dataDirectory, 'backups');
    this.changesPath = join(this.config.dataDirectory, 'changes');
  }

  async initialize(): Promise<void> {
    // Create directory structure
    await this.ensureDirectories();
    
    // Load current version
    await this.loadCurrentVersion();
    
    // Start background processes
    if (this.config.enableBackups) {
      this.startBackupScheduler();
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [this.dataPath, this.versionsPath, this.backupsPath, this.changesPath];
    
    for (const dir of dirs) {
      try {
        await mkdir(dir, { recursive: true });
      } catch (error: any) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  private async loadCurrentVersion(): Promise<void> {
    try {
      const versionFile = join(this.dataPath, 'version.json');
      const versionData = await readFile(versionFile, 'utf-8');
      const version = JSON.parse(versionData);
      this.currentVersion = version.version;
    } catch {
      // Version file doesn't exist, start at 1
      this.currentVersion = 1;
      await this.saveVersion();
    }
  }

  private async saveVersion(): Promise<void> {
    const versionFile = join(this.dataPath, 'version.json');
    await writeFile(versionFile, JSON.stringify({ 
      version: this.currentVersion,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  // Core persistence operations
  async save<T>(entityType: string, data: T[], author?: string): Promise<void> {
    const fileName = `${entityType}.json`;
    const filePath = join(this.dataPath, fileName);
    
    // Load existing data for change tracking
    let existingData: T[] = [];
    try {
      existingData = await this.load<T>(entityType);
    } catch {
      // File doesn't exist yet
    }

    // Track changes if enabled
    if (this.config.enableChangeTracking && this.isTrackableData(data)) {
      this.trackChanges(entityType, existingData as ({ id: string })[], data, author);
    }

    // Create version snapshot if enabled
    if (this.config.enableVersioning) {
      await this.createVersionSnapshot(entityType, existingData);
    }

    // Save new data
    const jsonData = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonData);

    // Update version
    this.currentVersion++;
    await this.saveVersion();

    // Save change log
    if (this.config.enableChangeTracking && this.changeLog.length > 0) {
      await this.saveChangeLog();
    }
  }

  async load<T>(entityType: string): Promise<T[]> {
    const fileName = `${entityType}.json`;
    const filePath = join(this.dataPath, fileName);
    
    try {
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async loadVersion<T>(entityType: string, version: number): Promise<T[]> {
    const fileName = `${entityType}_v${version}.json`;
    const filePath = join(this.versionsPath, fileName);
    
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  // Helper to check if data is trackable
  private isTrackableData(data: any[]): data is ({ id: string })[] {
    return data.length === 0 || (data[0] && typeof data[0].id === 'string');
  }

  // Change tracking
  private trackChanges<T extends { id: string }>(
    entityType: string,
    before: T[],
    after: T[],
    author?: string
  ): void {
    const beforeMap = new Map(before.map(item => [item.id, item]));
    const afterMap = new Map(after.map(item => [item.id, item]));

    // Find created items
    for (const [id, item] of afterMap) {
      if (!beforeMap.has(id)) {
        this.changeLog.push({
          id: `change_${Date.now()}_${Math.random()}`,
          type: 'CREATE',
          entityType,
          entityId: id,
          after: item,
          timestamp: new Date(),
          author
        });
      }
    }

    // Find updated items
    for (const [id, afterItem] of afterMap) {
      const beforeItem = beforeMap.get(id);
      if (beforeItem && JSON.stringify(beforeItem) !== JSON.stringify(afterItem)) {
        this.changeLog.push({
          id: `change_${Date.now()}_${Math.random()}`,
          type: 'UPDATE',
          entityType,
          entityId: id,
          before: beforeItem,
          after: afterItem,
          timestamp: new Date(),
          author
        });
      }
    }

    // Find deleted items
    for (const [id, item] of beforeMap) {
      if (!afterMap.has(id)) {
        this.changeLog.push({
          id: `change_${Date.now()}_${Math.random()}`,
          type: 'DELETE',
          entityType,
          entityId: id,
          before: item,
          timestamp: new Date(),
          author
        });
      }
    }
  }

  private async saveChangeLog(): Promise<void> {
    if (this.changeLog.length === 0) return;

    const fileName = `changes_${Date.now()}.json`;
    const filePath = join(this.changesPath, fileName);
    
    await writeFile(filePath, JSON.stringify(this.changeLog, null, 2));
    this.changeLog = [];
  }

  async getChangeHistory(entityType?: string, entityId?: string): Promise<ChangeRecord[]> {
    const changeFiles = await readdir(this.changesPath);
    let allChanges: ChangeRecord[] = [];

    for (const file of changeFiles) {
      if (file.endsWith('.json')) {
        const filePath = join(this.changesPath, file);
        const changes = JSON.parse(await readFile(filePath, 'utf-8'));
        allChanges.push(...changes);
      }
    }

    // Filter by entity type and ID if specified
    return allChanges.filter(change => {
      if (entityType && change.entityType !== entityType) return false;
      if (entityId && change.entityId !== entityId) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Versioning
  private async createVersionSnapshot<T>(entityType: string, data: T[]): Promise<void> {
    if (!this.config.enableVersioning || data.length === 0) return;

    const fileName = `${entityType}_v${this.currentVersion}.json`;
    const filePath = join(this.versionsPath, fileName);
    
    await writeFile(filePath, JSON.stringify(data, null, 2));

    // Clean up old versions
    await this.cleanupOldVersions(entityType);
  }

  private async cleanupOldVersions(entityType: string): Promise<void> {
    const files = await readdir(this.versionsPath);
    const entityFiles = files.filter(f => f.startsWith(`${entityType}_v`) && f.endsWith('.json'));
    
    if (entityFiles.length <= this.config.maxVersions) return;

    // Sort by version number and remove oldest
    entityFiles.sort((a, b) => {
      const aVersion = parseInt(a.match(/_v(\d+)\.json$/)?.[1] || '0');
      const bVersion = parseInt(b.match(/_v(\d+)\.json$/)?.[1] || '0');
      return aVersion - bVersion;
    });

    const toDelete = entityFiles.slice(0, -this.config.maxVersions);
    for (const file of toDelete) {
      await require('fs/promises').unlink(join(this.versionsPath, file));
    }
  }

  async getVersionHistory(entityType: string): Promise<DataVersion[]> {
    const files = await readdir(this.versionsPath);
    const entityFiles = files.filter(f => f.startsWith(`${entityType}_v`) && f.endsWith('.json'));
    
    const versions: DataVersion[] = [];
    
    for (const file of entityFiles) {
      const version = parseInt(file.match(/_v(\d+)\.json$/)?.[1] || '0');
      const filePath = join(this.versionsPath, file);
      const stats = await stat(filePath);
      
      versions.push({
        version,
        timestamp: stats.mtime,
        checksum: await this.calculateChecksum(filePath),
        changes: await this.getChangeHistory(entityType)
      });
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const data = await readFile(filePath);
    const crypto = require('crypto');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Backup system
  private startBackupScheduler(): void {
    const intervalMs = this.config.backupInterval * 60 * 1000;
    
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('Backup failed:', error);
      }
    }, intervalMs);
  }

  async createBackup(description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupPath = join(this.backupsPath, backupName);
    
    await mkdir(backupPath, { recursive: true });

    // Copy all current data files
    const files = await readdir(this.dataPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const source = join(this.dataPath, file);
        const dest = join(backupPath, file);
        const data = await readFile(source);
        await writeFile(dest, data);
      }
    }

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      version: this.currentVersion,
      description: description || 'Automatic backup',
      files: files.filter(f => f.endsWith('.json'))
    };

    await writeFile(join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));

    return backupPath;
  }

  async restoreFromBackup(backupName: string): Promise<void> {
    const backupPath = join(this.backupsPath, backupName);
    
    // Verify backup exists and load metadata
    const metadataPath = join(backupPath, 'metadata.json');
    const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));

    // Create current backup before restore
    await this.createBackup('Before restore operation');

    // Restore all data files
    for (const file of metadata.files) {
      const source = join(backupPath, file);
      const dest = join(this.dataPath, file);
      const data = await readFile(source);
      await writeFile(dest, data);
    }

    // Update version
    this.currentVersion = metadata.version;
    await this.saveVersion();
  }

  async listBackups(): Promise<Array<{ name: string; timestamp: Date; description: string; size: number }>> {
    const backups = await readdir(this.backupsPath);
    const backupList = [];

    for (const backup of backups) {
      try {
        const metadataPath = join(this.backupsPath, backup, 'metadata.json');
        const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
        const stats = await stat(join(this.backupsPath, backup));
        
        backupList.push({
          name: backup,
          timestamp: new Date(metadata.timestamp),
          description: metadata.description,
          size: stats.size
        });
      } catch {
        // Skip invalid backups
      }
    }

    return backupList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Data integrity
  async validateDataIntegrity(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingReferences: 0,
      duplicateRecords: 0,
      issues: []
    };

    // Load all data types
    const entityTypes = ['organizations', 'contacts', 'deals', 'leads', 'tasks'];
    const allData: Record<string, any[]> = {};

    for (const entityType of entityTypes) {
      try {
        allData[entityType] = await this.load(entityType);
        report.totalRecords += allData[entityType].length;
      } catch {
        allData[entityType] = [];
      }
    }

    // Validate each entity type
    for (const [entityType, data] of Object.entries(allData)) {
      this.validateEntityData(entityType, data, allData, report);
    }

    return report;
  }

  private validateEntityData(
    entityType: string,
    data: any[],
    allData: Record<string, any[]>,
    report: DataIntegrityReport
  ): void {
    const seenIds = new Set();

    for (const item of data) {
      // Check for required fields
      if (!item.id) {
        report.issues.push({
          type: 'VALIDATION',
          entityType,
          entityId: item.id || 'unknown',
          message: 'Missing required field: id',
          severity: 'CRITICAL'
        });
        report.invalidRecords++;
        continue;
      }

      // Check for duplicates
      if (seenIds.has(item.id)) {
        report.issues.push({
          type: 'DUPLICATE',
          entityType,
          entityId: item.id,
          message: 'Duplicate ID found',
          severity: 'HIGH'
        });
        report.duplicateRecords++;
      }
      seenIds.add(item.id);

      // Validate references
      this.validateReferences(entityType, item, allData, report);

      report.validRecords++;
    }
  }

  private validateReferences(
    entityType: string,
    item: any,
    allData: Record<string, any[]>,
    report: DataIntegrityReport
  ): void {
    const referenceFields: Record<string, string[]> = {
      contacts: ['organisationId'],
      deals: ['organisationId', 'contactId'],
      tasks: ['targetId']
    };

    const fields = referenceFields[entityType] || [];
    
    for (const field of fields) {
      if (item[field]) {
        const referencedEntity = this.findReferencedEntity(item[field], allData);
        if (!referencedEntity) {
          report.issues.push({
            type: 'REFERENCE',
            entityType,
            entityId: item.id,
            message: `Missing referenced entity: ${field} = ${item[field]}`,
            severity: 'MEDIUM'
          });
          report.missingReferences++;
        }
      }
    }
  }

  private findReferencedEntity(id: string, allData: Record<string, any[]>): any {
    for (const data of Object.values(allData)) {
      const found = data.find(item => item.id === id);
      if (found) return found;
    }
    return null;
  }

  // Cross-system synchronization
  async syncWithUnifiedSystem(unifiedService: UnifiedOrganizationService): Promise<SyncStatus> {
    if (!this.config.enableCrossSystemSync) {
      return {
        lastSync: new Date(),
        status: 'FAILED',
        conflictsResolved: 0,
        errors: ['Cross-system sync is disabled'],
        itemsSynced: 0
      };
    }

    const syncStatus: SyncStatus = {
      lastSync: new Date(),
      status: 'SUCCESS',
      conflictsResolved: 0,
      errors: [],
      itemsSynced: 0
    };

    try {
      // Sync organizations
      const result = await unifiedService.syncAllOrganizations({
        direction: 'BIDIRECTIONAL',
        conflictResolution: 'MERGE_SMART',
        validateData: true,
        createMissing: true,
        updateExisting: true,
        deleteOrphaned: false
      });

      syncStatus.itemsSynced = result.synced;
      syncStatus.conflictsResolved = result.conflicts;
      syncStatus.errors = result.errors;

      if (result.errors.length > 0) {
        syncStatus.status = result.errors.length < result.synced ? 'PARTIAL' : 'FAILED';
      }

    } catch (error: any) {
      syncStatus.status = 'FAILED';
      syncStatus.errors.push(`Sync failed: ${error?.message || 'Unknown error'}`);
    }

    return syncStatus;
  }

  // Utility methods
  async getStats(): Promise<{
    currentVersion: number;
    totalEntities: number;
    lastBackup?: Date;
    storageSize: number;
    changeLogSize: number;
  }> {
    const files = await readdir(this.dataPath);
    const entityFiles = files.filter(f => f.endsWith('.json') && f !== 'version.json');
    
    let totalEntities = 0;
    for (const file of entityFiles) {
      const data = await this.load(file.replace('.json', ''));
      totalEntities += data.length;
    }

    // Calculate storage size
    let storageSize = 0;
    for (const file of files) {
      const stats = await stat(join(this.dataPath, file));
      storageSize += stats.size;
    }

    // Calculate change log size
    let changeLogSize = 0;
    try {
      const changeFiles = await readdir(this.changesPath);
      for (const file of changeFiles) {
        const stats = await stat(join(this.changesPath, file));
        changeLogSize += stats.size;
      }
    } catch {
      // Changes directory might not exist
    }

    // Get last backup
    let lastBackup: Date | undefined;
    try {
      const backups = await this.listBackups();
      if (backups.length > 0) {
        lastBackup = backups[0].timestamp;
      }
    } catch {
      // Backups might not exist
    }

    return {
      currentVersion: this.currentVersion,
      totalEntities,
      lastBackup,
      storageSize,
      changeLogSize
    };
  }
}