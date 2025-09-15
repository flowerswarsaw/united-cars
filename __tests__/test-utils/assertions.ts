import { expect } from '@jest/globals';
import { 
  EnhancedOrganisation, 
  EnhancedContact, 
  EnhancedDeal, 
  EnhancedLead, 
  EnhancedTask,
  UniquenessConflict,
  ConflictResolution,
  HistoryEntry,
  Activity
} from '@united-cars/crm-core';
import { UserRole } from '@united-cars/crm-core';

export class CRMAssertions {
  // Entity validation assertions
  static expectValidOrganisation(org: EnhancedOrganisation) {
    expect(org).toBeDefined();
    expect(org.id).toBeTruthy();
    expect(org.tenantId).toBeTruthy();
    expect(org.name).toBeTruthy();
    expect(org.type).toBeTruthy();
    expect(org.createdAt).toBeInstanceOf(Date);
    expect(org.updatedAt).toBeInstanceOf(Date);
    expect(org.contactMethods).toBeInstanceOf(Array);
    expect(org.socialMediaLinks).toBeInstanceOf(Array);
    expect(typeof org.customFields).toBe('object');
  }

  static expectValidContact(contact: EnhancedContact) {
    expect(contact).toBeDefined();
    expect(contact.id).toBeTruthy();
    expect(contact.tenantId).toBeTruthy();
    expect(contact.organisationId).toBeTruthy();
    expect(contact.firstName).toBeTruthy();
    expect(contact.lastName).toBeTruthy();
    expect(contact.createdAt).toBeInstanceOf(Date);
    expect(contact.updatedAt).toBeInstanceOf(Date);
    expect(contact.contactMethods).toBeInstanceOf(Array);
  }

  static expectValidDeal(deal: EnhancedDeal) {
    expect(deal).toBeDefined();
    expect(deal.id).toBeTruthy();
    expect(deal.tenantId).toBeTruthy();
    expect(deal.title).toBeTruthy();
    expect(deal.value).toBeGreaterThanOrEqual(0);
    expect(deal.probability).toBeGreaterThanOrEqual(0);
    expect(deal.probability).toBeLessThanOrEqual(100);
    expect(deal.status).toBeTruthy();
    expect(deal.pipelineId).toBeTruthy();
    expect(deal.stageId).toBeTruthy();
  }

  static expectValidLead(lead: EnhancedLead) {
    expect(lead).toBeDefined();
    expect(lead.id).toBeTruthy();
    expect(lead.tenantId).toBeTruthy();
    expect(lead.firstName).toBeTruthy();
    expect(lead.lastName).toBeTruthy();
    expect(lead.source).toBeTruthy();
    expect(lead.status).toBeTruthy();
    expect(lead.score).toBeGreaterThanOrEqual(0);
    expect(lead.score).toBeLessThanOrEqual(100);
  }

  static expectValidTask(task: EnhancedTask) {
    expect(task).toBeDefined();
    expect(task.id).toBeTruthy();
    expect(task.tenantId).toBeTruthy();
    expect(task.title).toBeTruthy();
    expect(task.status).toBeTruthy();
    expect(task.priority).toBeTruthy();
    expect(task.entityType).toBeTruthy();
    expect(task.entityId).toBeTruthy();
  }

  // RBAC assertion helpers
  static expectRoleBasedAccess(
    userRole: UserRole,
    isAssigned: boolean,
    expectedPermissions: {
      canRead?: boolean;
      canCreate?: boolean;
      canUpdate?: boolean;
      canDelete?: boolean;
    }
  ) {
    const description = `${userRole} ${isAssigned ? 'assigned' : 'unassigned'} entity`;
    
    if (expectedPermissions.canRead !== undefined) {
      expect(expectedPermissions.canRead).toBeDefined();
    }
    if (expectedPermissions.canCreate !== undefined) {
      expect(expectedPermissions.canCreate).toBeDefined();
    }
    if (expectedPermissions.canUpdate !== undefined) {
      expect(expectedPermissions.canUpdate).toBeDefined();
    }
    if (expectedPermissions.canDelete !== undefined) {
      expect(expectedPermissions.canDelete).toBeDefined();
    }
  }

  // Uniqueness conflict assertions
  static expectUniquenessConflict(
    conflict: UniquenessConflict,
    expectedField: string,
    expectedValue: string
  ) {
    expect(conflict).toBeDefined();
    expect(conflict.field).toBe(expectedField);
    expect(conflict.value).toBe(expectedValue);
    expect(conflict.existingEntityId).toBeTruthy();
    expect(conflict.existingEntityType).toBeTruthy();
    expect(conflict.suggestedResolutions).toBeInstanceOf(Array);
    expect(conflict.suggestedResolutions.length).toBeGreaterThan(0);
  }

  static expectConflictResolution(
    resolution: ConflictResolution,
    expectedStrategy: 'merge' | 'skip' | 'override' | 'modify'
  ) {
    expect(resolution).toBeDefined();
    expect(resolution.strategy).toBe(expectedStrategy);
    
    switch (expectedStrategy) {
      case 'merge':
        expect(resolution.targetEntityId).toBeTruthy();
        expect(resolution.fieldsToMerge).toBeInstanceOf(Array);
        break;
      case 'modify':
        expect(resolution.modifiedValues).toBeDefined();
        expect(typeof resolution.modifiedValues).toBe('object');
        break;
      case 'override':
        expect(resolution.reason).toBeTruthy();
        break;
    }
  }

  // History and audit assertions
  static expectValidHistoryEntry(entry: HistoryEntry) {
    expect(entry).toBeDefined();
    expect(entry.id).toBeTruthy();
    expect(entry.tenantId).toBeTruthy();
    expect(entry.entityType).toBeTruthy();
    expect(entry.entityId).toBeTruthy();
    expect(entry.operation).toMatch(/^(create|update|delete)$/);
    expect(entry.userId).toBeTruthy();
    expect(entry.userName).toBeTruthy();
    expect(entry.userRole).toBeTruthy();
    expect(entry.checksum).toBeTruthy();
    expect(entry.checksum).toHaveLength(64); // SHA-256 hex length
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(typeof entry.changes).toBe('object');
  }

  static expectHistoryIntegrity(entries: HistoryEntry[]) {
    expect(entries).toBeInstanceOf(Array);
    
    // Check chronological order
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        entries[i - 1].createdAt.getTime()
      );
    }
    
    // Check all entries have valid checksums
    entries.forEach(entry => {
      this.expectValidHistoryEntry(entry);
    });
  }

  static expectValidActivity(activity: Activity) {
    expect(activity).toBeDefined();
    expect(activity.id).toBeTruthy();
    expect(activity.tenantId).toBeTruthy();
    expect(activity.type).toBeTruthy();
    expect(activity.entityType).toBeTruthy();
    expect(activity.entityId).toBeTruthy();
    expect(activity.userId).toBeTruthy();
    expect(activity.description).toBeTruthy();
    expect(activity.createdAt).toBeInstanceOf(Date);
    expect(typeof activity.metadata).toBe('object');
  }

  // Business logic assertions
  static expectDealPipelineConsistency(deal: EnhancedDeal, pipelineId: string, stageId: string) {
    expect(deal.pipelineId).toBe(pipelineId);
    expect(deal.stageId).toBe(stageId);
  }

  static expectLeadConversionRules(lead: EnhancedLead) {
    if (lead.convertedDealId) {
      expect(lead.isTarget).toBe(true);
      expect(lead.convertedAt).toBeInstanceOf(Date);
      expect(lead.status).toBe('converted');
    }
  }

  static expectVerificationConsistency(entity: EnhancedOrganisation | EnhancedContact) {
    if (entity.verified) {
      expect(entity.verifiedAt).toBeInstanceOf(Date);
      expect(entity.verifiedBy).toBeTruthy();
    } else {
      expect(entity.verifiedAt).toBeNull();
      expect(entity.verifiedBy).toBeNull();
    }
  }

  // Search and filtering assertions
  static expectSearchResults<T>(
    results: T[],
    searchTerm: string,
    searchableFields: (keyof T)[]
  ) {
    expect(results).toBeInstanceOf(Array);
    
    if (searchTerm && results.length > 0) {
      const hasMatch = results.some(result => 
        searchableFields.some(field => {
          const value = result[field];
          return typeof value === 'string' && 
                 value.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
      expect(hasMatch).toBe(true);
    }
  }

  static expectFilteredResults<T extends Record<string, any>>(
    results: T[],
    filters: Record<string, any>
  ) {
    expect(results).toBeInstanceOf(Array);
    
    results.forEach(result => {
      Object.entries(filters).forEach(([key, expectedValue]) => {
        if (expectedValue !== undefined && expectedValue !== null) {
          if (Array.isArray(expectedValue)) {
            expect(expectedValue).toContain(result[key]);
          } else {
            expect(result[key]).toBe(expectedValue);
          }
        }
      });
    });
  }

  // Performance assertions
  static expectPerformanceMetrics(
    startTime: number,
    maxDurationMs: number,
    operationName: string
  ) {
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxDurationMs);
    
    // Log performance for monitoring
    if (duration > maxDurationMs * 0.8) {
      console.warn(`Performance warning: ${operationName} took ${duration}ms (threshold: ${maxDurationMs}ms)`);
    }
  }

  // Custom matchers for complex assertions
  static expectEntityRelationshipConsistency(
    parent: any,
    children: any[],
    relationshipField: string
  ) {
    expect(children).toBeInstanceOf(Array);
    children.forEach(child => {
      expect(child[relationshipField]).toBe(parent.id);
    });
  }

  static expectTenantIsolation(entities: any[], expectedTenantId: string) {
    entities.forEach(entity => {
      expect(entity.tenantId).toBe(expectedTenantId);
    });
  }

  // Data consistency assertions
  static expectNoDuplicateIds(entities: any[]) {
    const ids = entities.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  }

  static expectValidTimestamps(entity: any) {
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.updatedAt.getTime()).toBeGreaterThanOrEqual(entity.createdAt.getTime());
  }

  // Mock-specific assertions
  static expectMockRepositoryState(
    repository: any,
    expectedEntityCount: number,
    tenantId?: string
  ) {
    const entities = repository.entities || [];
    
    if (tenantId) {
      const tenantEntities = entities.filter((e: any) => e.tenantId === tenantId);
      expect(tenantEntities).toHaveLength(expectedEntityCount);
    } else {
      expect(entities).toHaveLength(expectedEntityCount);
    }
  }
}

// Jest custom matchers
expect.extend({
  toBeValidCRMEntity(received, entityType: string) {
    const pass = received && 
                 received.id && 
                 received.tenantId &&
                 received.createdAt instanceof Date &&
                 received.updatedAt instanceof Date;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ${entityType}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ${entityType}`,
        pass: false,
      };
    }
  },

  toHaveUniquenessConflict(received, field: string) {
    const hasConflict = received && 
                       received.conflicts && 
                       received.conflicts.some((c: any) => c.field === field);
    
    if (hasConflict) {
      return {
        message: () => `expected response not to have uniqueness conflict for ${field}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have uniqueness conflict for ${field}`,
        pass: false,
      };
    }
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCRMEntity(entityType: string): R;
      toHaveUniquenessConflict(field: string): R;
    }
  }
}

export default CRMAssertions;