/**
 * Unified Organization Service
 * 
 * Central service for managing organizations across both main system and CRM.
 * Provides:
 * - Cross-system synchronization
 * - Data integrity validation
 * - Conflict resolution
 * - Single API for organization operations
 */

import { 
  UnifiedOrganization,
  MainSystemOrg,
  CrmSystemOrganisation,
  UnifiedOrganizationType,
  OrganizationConnection
} from '../types/unified-organization';

import {
  transformMainOrgToUnified,
  transformUnifiedToMainOrg,
  transformCrmOrgToUnified,
  transformUnifiedToCrmOrg,
  validateUnifiedOrganization,
  normalizeUnifiedOrganization,
  mergeUnifiedOrganizations
} from '../utils/organization-transformers';

// Repository interfaces for dependency injection
export interface MainSystemOrgRepository {
  findById(id: string): Promise<MainSystemOrg | null>;
  findAll(): Promise<MainSystemOrg[]>;
  create(org: Omit<MainSystemOrg, 'id' | 'createdAt' | 'updatedAt'>): Promise<MainSystemOrg>;
  update(id: string, updates: Partial<MainSystemOrg>): Promise<MainSystemOrg | null>;
  delete(id: string): Promise<boolean>;
}

export interface CrmOrgRepository {
  findById(id: string): Promise<CrmSystemOrganisation | null>;
  findAll(): Promise<CrmSystemOrganisation[]>;
  create(org: Omit<CrmSystemOrganisation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CrmSystemOrganisation>;
  update(id: string, updates: Partial<CrmSystemOrganisation>): Promise<CrmSystemOrganisation | null>;
  delete(id: string): Promise<boolean>;
}

export interface UnifiedOrgRepository {
  findById(id: string): Promise<UnifiedOrganization | null>;
  findAll(): Promise<UnifiedOrganization[]>;
  findByType(type: UnifiedOrganizationType): Promise<UnifiedOrganization[]>;
  findConflicts(): Promise<UnifiedOrganization[]>;
  create(org: Omit<UnifiedOrganization, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedOrganization>;
  update(id: string, updates: Partial<UnifiedOrganization>): Promise<UnifiedOrganization | null>;
  delete(id: string): Promise<boolean>;
}

export interface SyncOptions {
  direction: 'MAIN_TO_UNIFIED' | 'CRM_TO_UNIFIED' | 'UNIFIED_TO_MAIN' | 'UNIFIED_TO_CRM' | 'BIDIRECTIONAL';
  conflictResolution: 'MAIN_WINS' | 'CRM_WINS' | 'MERGE_SMART' | 'MANUAL';
  validateData: boolean;
  createMissing: boolean;
  updateExisting: boolean;
  deleteOrphaned: boolean;
}

export class UnifiedOrganizationService {
  constructor(
    private mainRepo: MainSystemOrgRepository,
    private crmRepo: CrmOrgRepository,
    private unifiedRepo: UnifiedOrgRepository
  ) {}

  // Core CRUD operations using unified model
  async getOrganization(id: string): Promise<UnifiedOrganization | null> {
    let unified = await this.unifiedRepo.findById(id);
    
    if (!unified) {
      // Try to load from source systems
      const [mainOrg, crmOrg] = await Promise.all([
        this.mainRepo.findById(id),
        this.crmRepo.findById(id)
      ]);

      if (mainOrg && crmOrg) {
        // Both exist - merge them
        const mainUnified = transformMainOrgToUnified(mainOrg);
        const crmUnified = transformCrmOrgToUnified(crmOrg);
        unified = mergeUnifiedOrganizations(mainUnified, crmUnified);
        
        // Save the merged result
        await this.unifiedRepo.create(unified);
      } else if (mainOrg) {
        unified = transformMainOrgToUnified(mainOrg);
        await this.unifiedRepo.create(unified);
      } else if (crmOrg) {
        unified = transformCrmOrgToUnified(crmOrg);
        await this.unifiedRepo.create(unified);
      }
    }

    return unified;
  }

  async getAllOrganizations(): Promise<UnifiedOrganization[]> {
    return await this.unifiedRepo.findAll();
  }

  async getOrganizationsByType(type: UnifiedOrganizationType): Promise<UnifiedOrganization[]> {
    return await this.unifiedRepo.findByType(type);
  }

  async createOrganization(orgData: Omit<UnifiedOrganization, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedOrganization> {
    // Validate the data
    const normalized = normalizeUnifiedOrganization(orgData as UnifiedOrganization);
    const validation = validateUnifiedOrganization(normalized);
    
    if (!validation.isValid) {
      throw new Error(`Organization validation failed: ${validation.errors.join(', ')}`);
    }

    // Create in unified store
    const unified = await this.unifiedRepo.create(orgData);

    // Sync to appropriate source systems
    await this.syncToSourceSystems(unified);

    return unified;
  }

  async updateOrganization(id: string, updates: Partial<UnifiedOrganization>): Promise<UnifiedOrganization | null> {
    const existing = await this.getOrganization(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    const normalized = normalizeUnifiedOrganization(updated);
    const validation = validateUnifiedOrganization(normalized);

    if (!validation.isValid) {
      throw new Error(`Organization validation failed: ${validation.errors.join(', ')}`);
    }

    const result = await this.unifiedRepo.update(id, updates);
    if (result) {
      await this.syncToSourceSystems(result);
    }

    return result;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const unified = await this.getOrganization(id);
    if (!unified) return false;

    // Delete from all systems
    const [unifiedDeleted, mainDeleted, crmDeleted] = await Promise.all([
      this.unifiedRepo.delete(id),
      this.mainRepo.delete(id),
      this.crmRepo.delete(id)
    ]);

    return unifiedDeleted;
  }

  // Synchronization operations
  async syncAllOrganizations(options: Partial<SyncOptions> = {}): Promise<{
    synced: number;
    conflicts: number;
    errors: string[];
  }> {
    const fullOptions: SyncOptions = {
      direction: 'BIDIRECTIONAL',
      conflictResolution: 'MERGE_SMART',
      validateData: true,
      createMissing: true,
      updateExisting: true,
      deleteOrphaned: false,
      ...options
    };

    let synced = 0;
    let conflicts = 0;
    const errors: string[] = [];

    try {
      // Load all organizations from all systems
      const [mainOrgs, crmOrgs, unifiedOrgs] = await Promise.all([
        this.mainRepo.findAll(),
        this.crmRepo.findAll(),
        this.unifiedRepo.findAll()
      ]);

      // Create maps for efficient lookups
      const mainMap = new Map(mainOrgs.map(org => [org.id, org]));
      const crmMap = new Map(crmOrgs.map(org => [org.id, org]));
      const unifiedMap = new Map(unifiedOrgs.map(org => [org.id, org]));

      // Get all unique IDs
      const allIds = new Set([
        ...mainMap.keys(),
        ...crmMap.keys(),
        ...unifiedMap.keys()
      ]);

      for (const id of allIds) {
        try {
          const mainOrg = mainMap.get(id);
          const crmOrg = crmMap.get(id);
          const unifiedOrg = unifiedMap.get(id);

          await this.syncSingleOrganization(id, mainOrg, crmOrg, unifiedOrg, fullOptions);
          synced++;
        } catch (error: any) {
          errors.push(`Failed to sync organization ${id}: ${error?.message || 'Unknown error'}`);
          if (error?.message?.includes('conflict')) {
            conflicts++;
          }
        }
      }

    } catch (error: any) {
      errors.push(`Sync operation failed: ${error?.message || 'Unknown error'}`);
    }

    return { synced, conflicts, errors };
  }

  async findConflicts(): Promise<UnifiedOrganization[]> {
    return await this.unifiedRepo.findConflicts();
  }

  async resolveConflict(
    id: string, 
    resolution: 'MAIN_WINS' | 'CRM_WINS' | 'MERGE_SMART' | 'MANUAL',
    manualData?: Partial<UnifiedOrganization>
  ): Promise<UnifiedOrganization | null> {
    const [mainOrg, crmOrg] = await Promise.all([
      this.mainRepo.findById(id),
      this.crmRepo.findById(id)
    ]);

    if (!mainOrg && !crmOrg) return null;

    let resolved: UnifiedOrganization;

    if (resolution === 'MANUAL' && manualData) {
      resolved = manualData as UnifiedOrganization;
    } else if (mainOrg && crmOrg) {
      const mainUnified = transformMainOrgToUnified(mainOrg);
      const crmUnified = transformCrmOrgToUnified(crmOrg);
      const mergeStrategy = resolution === 'MANUAL' ? 'MERGE_SMART' : resolution;
      resolved = mergeUnifiedOrganizations(mainUnified, crmUnified, mergeStrategy);
    } else {
      resolved = mainOrg ? transformMainOrgToUnified(mainOrg) : transformCrmOrgToUnified(crmOrg!);
    }

    resolved.syncStatus = 'SYNCED';
    resolved.syncedAt = new Date();

    const result = await this.unifiedRepo.update(id, resolved);
    if (result) {
      await this.syncToSourceSystems(result);
    }

    return result;
  }

  // Private helper methods
  private async syncSingleOrganization(
    id: string,
    mainOrg: MainSystemOrg | undefined,
    crmOrg: CrmSystemOrganisation | undefined,
    unifiedOrg: UnifiedOrganization | undefined,
    options: SyncOptions
  ): Promise<void> {
    // Determine what to do based on what exists
    if (mainOrg && crmOrg && unifiedOrg) {
      // All three exist - check for conflicts
      const mainUnified = transformMainOrgToUnified(mainOrg);
      const crmUnified = transformCrmOrgToUnified(crmOrg);
      
      if (this.hasConflict(mainUnified, crmUnified, unifiedOrg)) {
        if (options.conflictResolution === 'MANUAL') {
          // Mark as conflict and skip
          await this.unifiedRepo.update(id, { syncStatus: 'CONFLICT' });
          throw new Error(`Manual resolution required for organization ${id} conflict`);
        } else {
          const resolved = mergeUnifiedOrganizations(mainUnified, crmUnified, options.conflictResolution);
          await this.unifiedRepo.update(id, resolved);
        }
      }
    } else if (options.createMissing) {
      // Create missing entries
      if (mainOrg && !unifiedOrg) {
        const unified = transformMainOrgToUnified(mainOrg);
        await this.unifiedRepo.create(unified);
      }
      if (crmOrg && !unifiedOrg) {
        const unified = transformCrmOrgToUnified(crmOrg);
        await this.unifiedRepo.create(unified);
      }
    }
  }

  private hasConflict(main: UnifiedOrganization, crm: UnifiedOrganization, unified: UnifiedOrganization): boolean {
    // Simple conflict detection - can be enhanced
    return main.name !== crm.name || 
           main.type !== crm.type ||
           main.updatedAt.getTime() !== unified.updatedAt.getTime();
  }

  private async syncToSourceSystems(unified: UnifiedOrganization): Promise<void> {
    // Determine which systems this org should exist in based on type and source
    const shouldSyncToMain = this.shouldSyncToMainSystem(unified);
    const shouldSyncToCrm = this.shouldSyncToCrmSystem(unified);

    if (shouldSyncToMain) {
      try {
        const mainOrg = transformUnifiedToMainOrg(unified);
        const existing = await this.mainRepo.findById(unified.id);
        
        if (existing) {
          await this.mainRepo.update(unified.id, mainOrg);
        } else {
          await this.mainRepo.create(mainOrg);
        }
      } catch (error: any) {
        console.warn(`Failed to sync to main system: ${error?.message || 'Unknown error'}`);
      }
    }

    if (shouldSyncToCrm) {
      try {
        const crmOrg = transformUnifiedToCrmOrg(unified);
        const existing = await this.crmRepo.findById(unified.id);
        
        if (existing) {
          await this.crmRepo.update(unified.id, crmOrg);
        } else {
          await this.crmRepo.create(crmOrg as CrmSystemOrganisation);
        }
      } catch (error: any) {
        console.warn(`Failed to sync to CRM system: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  private shouldSyncToMainSystem(unified: UnifiedOrganization): boolean {
    // Main system only handles DEALER and ADMIN types
    return [UnifiedOrganizationType.DEALER, UnifiedOrganizationType.ADMIN].includes(unified.type);
  }

  private shouldSyncToCrmSystem(unified: UnifiedOrganization): boolean {
    // CRM system can handle all types
    return true;
  }

  // Analytics and reporting
  async getOrganizationStats(): Promise<{
    total: number;
    byType: Record<UnifiedOrganizationType, number>;
    bySource: Record<'MAIN' | 'CRM' | 'UNIFIED', number>;
    conflicts: number;
    lastSyncAt?: Date;
  }> {
    const orgs = await this.unifiedRepo.findAll();
    const conflicts = await this.unifiedRepo.findConflicts();
    
    const byType = {} as Record<UnifiedOrganizationType, number>;
    const bySource = { MAIN: 0, CRM: 0, UNIFIED: 0 };
    
    orgs.forEach(org => {
      byType[org.type] = (byType[org.type] || 0) + 1;
      bySource[org.source] = (bySource[org.source] || 0) + 1;
    });

    const lastSyncAt = orgs
      .filter(org => org.syncedAt)
      .sort((a, b) => (b.syncedAt?.getTime() || 0) - (a.syncedAt?.getTime() || 0))[0]?.syncedAt;

    return {
      total: orgs.length,
      byType,
      bySource,
      conflicts: conflicts.length,
      lastSyncAt
    };
  }
}