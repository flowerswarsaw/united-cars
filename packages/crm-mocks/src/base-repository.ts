import { Repository, PaginatedResult, ListQuery, EntityValidator, BusinessRuleValidationResult, EntityType, ActivityType } from '@united-cars/crm-core';
import { nanoid } from 'nanoid';

// Global flag to track data initialization
let globalDataInitialized = false;

export class BaseRepository<T extends { id: string; tenantId: string; createdAt: Date; updatedAt: Date; createdBy?: string; updatedBy?: string }>
  implements Repository<T> {
  protected items: Map<string, T> = new Map();
  protected tenantId = 'united-cars';
  protected validator?: EntityValidator<T>;
  protected entityType?: EntityType;
  protected enableChangeTracking = true;

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

  // Allow subclasses to set a validator
  protected setValidator(validator: EntityValidator<T>): void {
    this.validator = validator;
  }

  // Allow subclasses to set entity type for change tracking
  protected setEntityType(entityType: EntityType): void {
    this.entityType = entityType;
  }

  // Allow subclasses to disable change tracking if needed
  protected setChangeTracking(enabled: boolean): void {
    this.enableChangeTracking = enabled;
  }

  // Helper method to throw validation errors
  protected throwValidationError(result: BusinessRuleValidationResult): never {
    const errorMessages = result.errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`);
    throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
  }

  async list(filter?: Partial<T>): Promise<T[]> {
    this.ensureDataInitialized();
    let results = Array.from(this.items.values());
    
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

  async get(id: string): Promise<T | undefined> {
    this.ensureDataInitialized();
    return this.items.get(id);
  }

  async create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, createdBy?: string): Promise<T> {
    // Run business rule validation if validator is present
    if (this.validator) {
      const validationResult = await this.validator.validateCreate(data);
      if (!validationResult.valid) {
        this.throwValidationError(validationResult);
      }
    }

    const now = new Date();
    const item = {
      ...data,
      id: nanoid(),
      tenantId: this.tenantId,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy
    } as T;
    
    this.items.set(item.id, item);

    // Note: Change tracking is handled by individual repositories to avoid circular imports

    return item;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>, updatedBy?: string): Promise<T | undefined> {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    // Run business rule validation if validator is present
    if (this.validator) {
      const validationResult = await this.validator.validateUpdate(id, data as Partial<T>, existing);
      if (!validationResult.valid) {
        this.throwValidationError(validationResult);
      }
    }
    
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
      updatedBy
    };
    
    this.items.set(id, updated);

    // Note: Change tracking is handled by individual repositories to avoid circular imports

    return updated;
  }

  async remove(id: string, deletedBy?: string): Promise<boolean> {
    const existing = this.items.get(id);
    if (!existing) return false;

    // Run business rule validation if validator is present
    if (this.validator) {
      const validationResult = await this.validator.validateDelete(id, existing);
      if (!validationResult.valid) {
        this.throwValidationError(validationResult);
      }
    }

    // Note: Change tracking is handled by individual repositories to avoid circular imports
    
    return this.items.delete(id);
  }

  async search(query: string, searchFields?: (keyof T)[]): Promise<T[]> {
    this.ensureDataInitialized();
    const lowerQuery = query.toLowerCase();
    const defaultSearchFields: (keyof T)[] = ['name', 'title', 'firstName', 'lastName'] as (keyof T)[];
    const fieldsToSearch = searchFields || defaultSearchFields;
    
    return Array.from(this.items.values()).filter(item => {
      return fieldsToSearch.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }

  async listPaginated(query: ListQuery<T>): Promise<PaginatedResult<T>> {
    this.ensureDataInitialized();
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

  async searchPaginated(query: string, searchFields?: (keyof T)[], pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<T>> {
    this.ensureDataInitialized();
    const { page = 1, limit = 20 } = pagination || {};
    
    // Use the existing search method to get filtered results
    const searchResults = await this.search(query, searchFields);
    
    // Apply pagination to search results
    const total = searchResults.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = searchResults.slice(startIndex, endIndex);

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
    });
  }
}