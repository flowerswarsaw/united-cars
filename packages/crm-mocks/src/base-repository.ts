import { Repository } from '@united-cars/crm-core';
import { nanoid } from 'nanoid';

export class BaseRepository<T extends { id: string; tenantId: string; createdAt: Date; updatedAt: Date }> 
  implements Repository<T> {
  protected items: Map<string, T> = new Map();
  protected tenantId = 'tenant_001';

  async list(filter?: Partial<T>): Promise<T[]> {
    let results = Array.from(this.items.values());
    
    if (filter) {
      results = results.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          return (item as any)[key] === value;
        });
      });
    }
    
    return results;
  }

  async get(id: string): Promise<T | undefined> {
    return this.items.get(id);
  }

  async create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const item = {
      ...data,
      id: nanoid(),
      tenantId: this.tenantId,
      createdAt: now,
      updatedAt: now
    } as T;
    
    this.items.set(item.id, item);
    return item;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<T | undefined> {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    
    this.items.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async search(query: string): Promise<T[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(item => {
      const searchableFields = ['name', 'title', 'firstName', 'lastName', 'email'];
      return searchableFields.some(field => {
        const value = (item as any)[field];
        return value && value.toString().toLowerCase().includes(lowerQuery);
      });
    });
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