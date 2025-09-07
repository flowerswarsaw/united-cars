/**
 * Persistence Service Factory
 * 
 * Creates and configures persistence services for different environments and use cases.
 * Provides integration points between enhanced persistence and existing systems.
 */

import { EnhancedPersistence, PersistenceConfig } from './enhanced-persistence';
import { UnifiedOrganizationService } from '@united-cars/core';

// Environment configurations
export const DEVELOPMENT_CONFIG: Partial<PersistenceConfig> = {
  dataDirectory: './data/dev',
  enableVersioning: true,
  maxVersions: 5,
  enableBackups: false, // Disable in development
  enableChangeTracking: true,
  enableCrossSystemSync: true
};

export const STAGING_CONFIG: Partial<PersistenceConfig> = {
  dataDirectory: './data/staging',
  enableVersioning: true,
  maxVersions: 10,
  enableBackups: true,
  backupInterval: 30, // 30 minutes
  enableChangeTracking: true,
  enableCrossSystemSync: true
};

export const PRODUCTION_CONFIG: Partial<PersistenceConfig> = {
  dataDirectory: './data/production',
  enableVersioning: true,
  maxVersions: 20,
  enableBackups: true,
  backupInterval: 15, // 15 minutes
  enableChangeTracking: true,
  enableCrossSystemSync: true
};

export type Environment = 'development' | 'staging' | 'production' | 'test';

export class PersistenceServiceFactory {
  private static instances: Map<string, EnhancedPersistence> = new Map();

  /**
   * Get or create a persistence service for the specified environment
   */
  static async getPersistenceService(
    environment: Environment = 'development',
    customConfig?: Partial<PersistenceConfig>
  ): Promise<EnhancedPersistence> {
    const key = `${environment}_${JSON.stringify(customConfig || {})}`;
    
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let config: Partial<PersistenceConfig>;
    
    switch (environment) {
      case 'production':
        config = { ...PRODUCTION_CONFIG, ...customConfig };
        break;
      case 'staging':
        config = { ...STAGING_CONFIG, ...customConfig };
        break;
      case 'test':
        config = {
          dataDirectory: './data/test',
          enableVersioning: false,
          enableBackups: false,
          enableChangeTracking: false,
          enableCrossSystemSync: false,
          ...customConfig
        };
        break;
      default:
        config = { ...DEVELOPMENT_CONFIG, ...customConfig };
    }

    const service = new EnhancedPersistence(config);
    await service.initialize();
    
    this.instances.set(key, service);
    return service;
  }

  /**
   * Create a lightweight persistence service for testing
   */
  static async createTestService(testName?: string): Promise<EnhancedPersistence> {
    const config: Partial<PersistenceConfig> = {
      dataDirectory: testName ? `./data/test/${testName}` : './data/test/default',
      enableVersioning: false,
      enableBackups: false,
      enableChangeTracking: false,
      enableCrossSystemSync: false
    };

    const service = new EnhancedPersistence(config);
    await service.initialize();
    return service;
  }

  /**
   * Create a full-featured persistence service for admin panels
   */
  static async createAdminService(
    environment: Environment = 'development'
  ): Promise<EnhancedPersistence> {
    const baseConfig = await this.getEnvironmentConfig(environment);
    
    const adminConfig: Partial<PersistenceConfig> = {
      ...baseConfig,
      enableVersioning: true,
      enableBackups: true,
      enableChangeTracking: true,
      enableCrossSystemSync: true,
      maxVersions: environment === 'production' ? 50 : 20
    };

    const service = new EnhancedPersistence(adminConfig);
    await service.initialize();
    return service;
  }

  private static async getEnvironmentConfig(environment: Environment): Promise<Partial<PersistenceConfig>> {
    switch (environment) {
      case 'production': return PRODUCTION_CONFIG;
      case 'staging': return STAGING_CONFIG;
      case 'test': return { dataDirectory: './data/test' };
      default: return DEVELOPMENT_CONFIG;
    }
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}

/**
 * Persistence Service Manager
 * 
 * High-level service that coordinates between different persistence services
 * and provides unified access patterns for the application.
 */
export class PersistenceServiceManager {
  private enhancedPersistence: EnhancedPersistence;
  private unifiedOrgService?: UnifiedOrganizationService;
  private environment: Environment;

  constructor(
    enhancedPersistence: EnhancedPersistence,
    environment: Environment = 'development'
  ) {
    this.enhancedPersistence = enhancedPersistence;
    this.environment = environment;
  }

  /**
   * Set the unified organization service for cross-system sync
   */
  setUnifiedOrganizationService(service: UnifiedOrganizationService): void {
    this.unifiedOrgService = service;
  }

  /**
   * Save data with automatic cross-system sync
   */
  async saveWithSync<T>(
    entityType: string,
    data: T[],
    options: {
      author?: string;
      syncToUnified?: boolean;
      validateBeforeSave?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<{
    saved: boolean;
    syncStatus?: any;
    validationIssues?: any[];
    backupPath?: string;
  }> {
    const result = {
      saved: false,
      syncStatus: undefined as any,
      validationIssues: undefined as any[] | undefined,
      backupPath: undefined as string | undefined
    };

    try {
      // Validate data if requested
      if (options.validateBeforeSave) {
        const integrityReport = await this.enhancedPersistence.validateDataIntegrity();
        if (integrityReport.issues.length > 0) {
          result.validationIssues = integrityReport.issues;
        }
      }

      // Create backup if requested
      if (options.createBackup) {
        result.backupPath = await this.enhancedPersistence.createBackup(
          `Manual backup before saving ${entityType}`
        );
      }

      // Save the data
      await this.enhancedPersistence.save(entityType, data, options.author);
      result.saved = true;

      // Sync to unified system if requested and available
      if (options.syncToUnified && this.unifiedOrgService && entityType === 'organizations') {
        result.syncStatus = await this.enhancedPersistence.syncWithUnifiedSystem(
          this.unifiedOrgService
        );
      }

    } catch (error) {
      console.error(`Failed to save ${entityType}:`, error);
      throw error;
    }

    return result;
  }

  /**
   * Load data with fallback and validation
   */
  async loadWithValidation<T>(
    entityType: string,
    options: {
      validateOnLoad?: boolean;
      useBackupOnFailure?: boolean;
      fallbackToVersion?: number;
    } = {}
  ): Promise<{
    data: T[];
    validationIssues?: any[];
    usedFallback?: boolean;
    fallbackSource?: string;
  }> {
    const result = {
      data: [] as T[],
      validationIssues: undefined as any[] | undefined,
      usedFallback: false,
      fallbackSource: undefined as string | undefined
    };

    try {
      // Try to load current data
      result.data = await this.enhancedPersistence.load<T>(entityType);
      
      // Validate if requested
      if (options.validateOnLoad) {
        const integrityReport = await this.enhancedPersistence.validateDataIntegrity();
        if (integrityReport.issues.length > 0) {
          result.validationIssues = integrityReport.issues;
        }
      }

    } catch (error) {
      console.error(`Failed to load ${entityType}:`, error);

      // Try fallback options
      if (options.fallbackToVersion) {
        try {
          result.data = await this.enhancedPersistence.loadVersion<T>(
            entityType,
            options.fallbackToVersion
          );
          result.usedFallback = true;
          result.fallbackSource = `version_${options.fallbackToVersion}`;
        } catch (fallbackError) {
          console.error(`Fallback to version ${options.fallbackToVersion} failed:`, fallbackError);
        }
      }

      if (!result.usedFallback && options.useBackupOnFailure) {
        // Try to restore from latest backup
        try {
          const backups = await this.enhancedPersistence.listBackups();
          if (backups.length > 0) {
            const latestBackup = backups[0];
            await this.enhancedPersistence.restoreFromBackup(latestBackup.name);
            result.data = await this.enhancedPersistence.load<T>(entityType);
            result.usedFallback = true;
            result.fallbackSource = `backup_${latestBackup.name}`;
          }
        } catch (restoreError) {
          console.error('Backup restore failed:', restoreError);
        }
      }

      // If still no data and no fallback worked, return empty array
      if (!result.usedFallback) {
        result.data = [];
      }
    }

    return result;
  }

  /**
   * Get comprehensive system health information
   */
  async getSystemHealth(): Promise<{
    persistence: any;
    dataIntegrity: any;
    syncStatus?: any;
    environment: Environment;
    timestamp: Date;
  }> {
    const [stats, integrityReport] = await Promise.all([
      this.enhancedPersistence.getStats(),
      this.enhancedPersistence.validateDataIntegrity()
    ]);

    let syncStatus;
    if (this.unifiedOrgService) {
      syncStatus = await this.enhancedPersistence.syncWithUnifiedSystem(this.unifiedOrgService);
    }

    return {
      persistence: stats,
      dataIntegrity: integrityReport,
      syncStatus,
      environment: this.environment,
      timestamp: new Date()
    };
  }

  /**
   * Perform maintenance operations
   */
  async performMaintenance(): Promise<{
    backupCreated: string;
    integrityIssues: number;
    syncStatus?: any;
    cleanupPerformed: boolean;
  }> {
    // Create maintenance backup
    const backupPath = await this.enhancedPersistence.createBackup('Maintenance backup');

    // Check data integrity
    const integrityReport = await this.enhancedPersistence.validateDataIntegrity();

    // Sync if unified service is available
    let syncStatus;
    if (this.unifiedOrgService) {
      syncStatus = await this.enhancedPersistence.syncWithUnifiedSystem(this.unifiedOrgService);
    }

    return {
      backupCreated: backupPath,
      integrityIssues: integrityReport.issues.length,
      syncStatus,
      cleanupPerformed: true
    };
  }
}

// Global instance factory for convenience
let globalPersistenceManager: PersistenceServiceManager | null = null;

export async function getGlobalPersistenceManager(
  environment: Environment = 'development'
): Promise<PersistenceServiceManager> {
  if (!globalPersistenceManager) {
    const persistence = await PersistenceServiceFactory.getPersistenceService(environment);
    globalPersistenceManager = new PersistenceServiceManager(persistence, environment);
  }
  
  return globalPersistenceManager;
}

export function resetGlobalPersistenceManager(): void {
  globalPersistenceManager = null;
  PersistenceServiceFactory.clearCache();
}