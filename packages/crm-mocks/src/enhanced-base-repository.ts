import { Repository, PaginatedResult, ListQuery, EntityValidator, BusinessRuleValidationResult, EntityType } from '@united-cars/crm-core';
import { RBACUser, canUserAccessEntity, getUserPermissions, RBACPermissions } from '@united-cars/crm-core/src/rbac';
import { uniquenessManager, UniquenessConflict, UNIQUENESS_FIELDS, UniquenessField } from '@united-cars/crm-core/src/uniqueness';
import { historyLogger, HistoryEntry } from '@united-cars/crm-core/src/history';
import { nanoid } from 'nanoid';

// Global flag to track data initialization
let globalDataInitialized = false;

export interface EnhancedEntityBase {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  assignedUserId?: string; // For RBAC assignment tracking
  verified?: boolean; // For uniqueness verification
}

export interface CreateOptions {
  user: RBACUser;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  skipUniquenessCheck?: boolean;
  skipHistoryLog?: boolean;
}

export interface UpdateOptions extends CreateOptions {
  validateBeforeUpdate?: boolean;
}

export interface DeleteOptions extends CreateOptions {
  softDelete?: boolean;
}

export interface ListOptions {
  user: RBACUser;
  includeDeleted?: boolean;
  onlyAssigned?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  conflicts?: UniquenessConflict[];
  warnings?: string[];
}

export class EnhancedBaseRepository<T extends EnhancedEntityBase> implements Repository<T> {
  protected items = new Map<string, T>();
  protected tenantId = 'tenant_001';
  protected validator?: EntityValidator<T>;
  protected entityType: EntityType;
  protected entityTypeName: keyof RBACPermissions;
  protected enableChangeTracking = true;
  protected uniquenessFields: string[] = [];

  constructor(entityType: EntityType, entityTypeName: keyof RBACPermissions) {
    this.entityType = entityType;
    this.entityTypeName = entityTypeName;
  }

  // Ensure data is initialized before any repository operation
  private ensureDataInitialized(): void {
    if (typeof window !== 'undefined' || globalDataInitialized) return;
    
    try {
      const { initializeData } = require('./index');
      initializeData();
      globalDataInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize CRM data:', error);
    }
  }

  // RBAC access control
  private checkAccess(user: RBACUser, operation: keyof RBACPermissions[keyof RBACPermissions], entityId?: string, entity?: T): void {
    if (!canUserAccessEntity(user, this.entityTypeName, operation, entityId, entity?.assignedUserId)) {
      throw new Error(`Access denied: User ${user.id} cannot ${operation} ${this.entityTypeName}`);
    }
  }

  // Filter results based on RBAC
  private filterByAccess(items: T[], user: RBACUser): T[] {
    const permissions = getUserPermissions(user.role);
    const entityPermissions = permissions[this.entityTypeName];

    if (entityPermissions.canReadAll) {
      return items;
    }

    // Filter to only assigned items or items created by the user
    return items.filter(item => 
      user.assignedEntityIds?.includes(item.id) || 
      item.assignedUserId === user.id ||
      item.createdBy === user.id
    );
  }

  // Uniqueness validation
  protected checkUniqueness(data: Partial<T>, excludeId?: string): UniquenessConflict[] {
    if (!this.uniquenessFields.length) return [];

    const conflicts: UniquenessConflict[] = [];

    for (const field of this.uniquenessFields) {
      const value = this.getNestedValue(data as any, field);
      if (value && typeof value === 'string') {
        const conflict = uniquenessManager.checkConflicts(
          field,
          value,
          excludeId,
          this.entityTypeName
        );
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  // Helper to get nested field values
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Update uniqueness constraints
  protected updateUniquenessConstraints(item: T): void {
    if (!this.uniquenessFields.length) return;

    // Remove old constraints
    uniquenessManager.removeConstraintsForEntity(this.entityTypeName, item.id);

    // Add new constraints
    for (const field of this.uniquenessFields) {
      const value = this.getNestedValue(item, field);
      if (value && typeof value === 'string') {
        uniquenessManager.addConstraint(
          field,
          this.entityTypeName,
          item.id,
          value,
          item.verified
        );
      }
    }
  }

  // Enhanced validation
  protected async validateEntity(data: Partial<T>, operation: 'create' | 'update', existingEntity?: T): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      conflicts: [],
      warnings: []
    };

    // Business rule validation
    if (this.validator) {
      let validationResult: BusinessRuleValidationResult;
      
      if (operation === 'create') {
        validationResult = await this.validator.validateCreate(data);
      } else {
        validationResult = await this.validator.validateUpdate(existingEntity!.id, data, existingEntity!);
      }
      
      if (!validationResult.valid) {
        result.isValid = false;
        result.errors = validationResult.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`);
      }
    }

    // Uniqueness validation
    const conflicts = this.checkUniqueness(data, existingEntity?.id);
    if (conflicts.length > 0) {
      result.isValid = false;
      result.conflicts = conflicts;
    }

    return result;
  }

  // Log changes to history
  private logChange(
    operation: HistoryEntry['operation'],
    entityId: string,
    user: RBACUser,
    options: {
      beforeData?: Record<string, any>;
      afterData?: Record<string, any>;
      changedFields?: string[];
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    } = {}
  ): void {
    if (!this.enableChangeTracking) return;

    historyLogger.logEntry(
      this.entityTypeName,
      entityId,
      operation,
      user.id,
      {
        userName: user.id, // Could be enhanced with actual user names
        ...options
      }
    );
  }

  // Enhanced list method with RBAC
  async list(filter?: Partial<T>, options?: ListOptions): Promise<T[]> {
    this.ensureDataInitialized();
    let results = Array.from(this.items.values());

    // Apply RBAC filtering
    if (options?.user) {
      results = this.filterByAccess(results, options.user);
    }

    // Apply basic filtering
    if (filter) {
      results = results.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          const itemValue = item[key as keyof T];
          return itemValue === value;
        });
      });
    }

    return results;
  }

  // Enhanced get method with RBAC
  async get(id: string, user?: RBACUser): Promise<T | undefined> {
    this.ensureDataInitialized();
    const item = this.items.get(id);
    
    if (!item) return undefined;

    // Check RBAC access
    if (user) {
      try {
        this.checkAccess(user, 'canRead', id, item);
      } catch {
        return undefined; // Access denied
      }
    }

    return item;
  }

  // Enhanced create method with full validation and logging
  async create(
    data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, 
    options: CreateOptions
  ): Promise<{ success: boolean; data?: T; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    // Check RBAC permissions
    this.checkAccess(options.user, 'canCreate');

    // Validate entity
    if (!options.skipUniquenessCheck) {
      const validation = await this.validateEntity(data as Partial<T>, 'create');
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          conflicts: validation.conflicts
        };
      }
    }

    // Create entity
    const now = new Date();
    const item = {
      ...data,
      id: nanoid(),
      tenantId: this.tenantId,
      createdAt: now,
      updatedAt: now,
      createdBy: options.user.id,
      updatedBy: options.user.id,
      assignedUserId: data.assignedUserId || options.user.id
    } as T;

    this.items.set(item.id, item);

    // Update uniqueness constraints
    this.updateUniquenessConstraints(item);

    // Log to history
    if (!options.skipHistoryLog) {
      this.logChange('CREATE', item.id, options.user, {
        afterData: item as Record<string, any>,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        reason: options.reason
      });
    }

    return { success: true, data: item };
  }

  // Enhanced update method
  async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
    options: UpdateOptions
  ): Promise<{ success: boolean; data?: T; errors?: string[]; conflicts?: UniquenessConflict[] }> {
    const existing = this.items.get(id);
    if (!existing) {
      return { success: false, errors: ['Entity not found'] };
    }

    // Check RBAC permissions
    this.checkAccess(options.user, 'canUpdate', id, existing);

    // Validate entity
    if (!options.skipUniquenessCheck) {
      const validation = await this.validateEntity(data as Partial<T>, 'update', existing);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          conflicts: validation.conflicts
        };
      }
    }

    // Calculate changed fields
    const changedFields = Object.keys(data).filter(key => {
      const oldValue = existing[key as keyof T];
      const newValue = data[key as keyof T];
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });

    // Create updated entity
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
      updatedBy: options.user.id
    };

    this.items.set(id, updated);

    // Update uniqueness constraints
    this.updateUniquenessConstraints(updated);

    // Log to history
    if (!options.skipHistoryLog && changedFields.length > 0) {
      this.logChange('UPDATE', id, options.user, {
        beforeData: existing as Record<string, any>,
        afterData: updated as Record<string, any>,
        changedFields,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        reason: options.reason
      });
    }

    return { success: true, data: updated };
  }

  // Enhanced remove method
  async remove(
    id: string,
    options: DeleteOptions
  ): Promise<{ success: boolean; errors?: string[] }> {
    const existing = this.items.get(id);
    if (!existing) {
      return { success: false, errors: ['Entity not found'] };
    }

    // Check RBAC permissions
    this.checkAccess(options.user, 'canDelete', id, existing);

    // Business rule validation
    if (this.validator) {
      const validationResult = await this.validator.validateDelete(id, existing);
      if (!validationResult.valid) {
        const errorMessages = validationResult.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`);
        return { success: false, errors: errorMessages };
      }
    }

    // Remove uniqueness constraints
    uniquenessManager.removeConstraintsForEntity(this.entityTypeName, id);

    // Log to history before deletion
    if (!options.skipHistoryLog) {
      this.logChange('DELETE', id, options.user, {
        beforeData: existing as Record<string, any>,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        reason: options.reason
      });
    }

    // Remove from storage
    const deleted = this.items.delete(id);

    return { success: deleted };
  }

  // Enhanced search with RBAC
  async search(query: string, searchFields?: (keyof T)[], user?: RBACUser): Promise<T[]> {
    this.ensureDataInitialized();
    const lowerQuery = query.toLowerCase();
    const defaultSearchFields: (keyof T)[] = ['name', 'title', 'firstName', 'lastName'] as (keyof T)[];
    const fieldsToSearch = searchFields || defaultSearchFields;
    
    let results = Array.from(this.items.values()).filter(item => {
      return fieldsToSearch.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });

    // Apply RBAC filtering
    if (user) {
      results = this.filterByAccess(results, user);
    }

    return results;
  }

  // Get entity history
  async getHistory(entityId: string, user: RBACUser): Promise<HistoryEntry[]> {
    // Check if user can read the entity
    const entity = await this.get(entityId, user);
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    return historyLogger.getHistory({
      entityType: this.entityTypeName,
      entityId
    });
  }

  // Verify entity fields
  async verifyField(entityId: string, field: string, user: RBACUser): Promise<{ success: boolean; errors?: string[] }> {
    const entity = this.items.get(entityId);
    if (!entity) {
      return { success: false, errors: ['Entity not found'] };
    }

    // Check RBAC permissions (admins only for verification)
    if (user.role !== 'admin') {
      return { success: false, errors: ['Only admins can verify fields'] };
    }

    // Update verification status
    const updated = { ...entity, verified: true };
    this.items.set(entityId, updated);

    // Update uniqueness constraint verification
    const value = this.getNestedValue(entity, field);
    if (value && typeof value === 'string') {
      uniquenessManager.updateVerificationStatus(field, value, true);
    }

    // Log verification
    this.logChange('UPDATE', entityId, user, {
      beforeData: entity as Record<string, any>,
      afterData: updated as Record<string, any>,
      changedFields: ['verified'],
      reason: `Verified field: ${field}`
    });

    return { success: true };
  }

  // Set uniqueness fields for this repository
  protected setUniquenessFields(fields: string[]): void {
    this.uniquenessFields = fields;
  }

  // Legacy compatibility methods
  async listPaginated(query: ListQuery<T>): Promise<PaginatedResult<T>> {
    // Implementation similar to original but with RBAC
    return this.listPaginatedWithUser(query, query.user as RBACUser);
  }

  async listPaginatedWithUser(query: ListQuery<T> & { user?: RBACUser }, user?: RBACUser): Promise<PaginatedResult<T>> {
    this.ensureDataInitialized();
    const requestUser = user || query.user;
    
    if (!requestUser) {
      throw new Error('User context required for paginated listing');
    }

    const {
      page = 1,
      limit = 20,
      sortBy,
      sortOrder = 'desc',
      search,
      filter
    } = query;

    // Start with all items
    let results = Array.from(this.items.values());

    // Apply RBAC filtering
    results = this.filterByAccess(results, requestUser);

    // Apply filtering
    if (filter) {
      results = results.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          const itemValue = item[key as keyof T];
          return itemValue === value;
        });
      });
    }

    // Apply search
    if (search) {
      const lowerQuery = search.toLowerCase();
      const defaultSearchFields: (keyof T)[] = ['name', 'title', 'firstName', 'lastName'] as (keyof T)[];
      results = results.filter(item => {
        return defaultSearchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(lowerQuery);
        });
      });
    }

    // Apply sorting
    if (sortBy) {
      results.sort((a, b) => {
        const aValue = a[sortBy as keyof T];
        const bValue = b[sortBy as keyof T];
        
        if (aValue === bValue) return 0;
        
        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sort by createdAt desc (newest first)
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Calculate pagination
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = results.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Helper methods for mock persistence
  clear(): void {
    this.items.clear();
  }

  seed(items: T[]): void {
    items.forEach(item => {
      this.items.set(item.id, item);
      this.updateUniquenessConstraints(item);
    });
  }

  toJSON(): T[] {
    return Array.from(this.items.values());
  }

  fromJSON(data: T[]): void {
    this.clear();
    data.forEach(item => {
      // Convert date strings back to Date objects
      if (typeof item.createdAt === 'string') {
        item.createdAt = new Date(item.createdAt);
      }
      if (typeof item.updatedAt === 'string') {
        item.updatedAt = new Date(item.updatedAt);
      }
      this.items.set(item.id, item);
      this.updateUniquenessConstraints(item);
    });
  }
}