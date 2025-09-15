import { 
  CustomFieldDef,
  CustomFieldValue,
  CustomFieldRepository as ICustomFieldRepository,
  EntityType,
  makeCustomFieldDef,
  makeCustomFieldValue
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

class CustomFieldRepositoryImpl implements ICustomFieldRepository {
  private fieldDefs: Map<string, CustomFieldDef> = new Map();
  private fieldValues: Map<string, CustomFieldValue> = new Map();
  private tenantId = 'tenant_001';

  async defineField(def: Omit<CustomFieldDef, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<CustomFieldDef> {
    const fieldDef = makeCustomFieldDef(def.entityType, def);
    this.fieldDefs.set(fieldDef.id, fieldDef);
    return fieldDef;
  }

  async updateFieldDef(id: string, data: Partial<Omit<CustomFieldDef, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<CustomFieldDef | undefined> {
    const existing = this.fieldDefs.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.fieldDefs.set(id, updated);
    return updated;
  }

  async deactivateField(id: string): Promise<boolean> {
    const field = this.fieldDefs.get(id);
    if (!field) return false;

    this.fieldDefs.set(id, {
      ...field,
      isActive: false,
      updatedAt: new Date()
    });

    return true;
  }

  async getFieldDefs(entityType: EntityType): Promise<CustomFieldDef[]> {
    return Array.from(this.fieldDefs.values())
      .filter(def => def.entityType === entityType && def.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async setValue(fieldDefId: string, entityId: string, value: any): Promise<CustomFieldValue> {
    const key = `${fieldDefId}_${entityId}`;
    const existing = this.fieldValues.get(key);

    if (existing) {
      const updated = {
        ...existing,
        value,
        updatedAt: new Date()
      };
      this.fieldValues.set(key, updated);
      return updated;
    }

    const fieldValue = makeCustomFieldValue(fieldDefId, entityId, value);
    this.fieldValues.set(key, fieldValue);
    return fieldValue;
  }

  async getValue(fieldDefId: string, entityId: string): Promise<CustomFieldValue | undefined> {
    const key = `${fieldDefId}_${entityId}`;
    return this.fieldValues.get(key);
  }

  async getValues(entityId: string): Promise<CustomFieldValue[]> {
    return Array.from(this.fieldValues.values())
      .filter(value => value.entityId === entityId);
  }

  // Helper methods for persistence
  clear(): void {
    this.fieldDefs.clear();
    this.fieldValues.clear();
  }

  seedFieldDefs(defs: CustomFieldDef[]): void {
    defs.forEach(def => {
      this.fieldDefs.set(def.id, def);
    });
  }

  seedFieldValues(values: CustomFieldValue[]): void {
    values.forEach(value => {
      const key = `${value.fieldDefId}_${value.entityId}`;
      this.fieldValues.set(key, value);
    });
  }

  toJSON(): { fieldDefs: CustomFieldDef[]; fieldValues: CustomFieldValue[] } {
    return {
      fieldDefs: Array.from(this.fieldDefs.values()),
      fieldValues: Array.from(this.fieldValues.values())
    };
  }

  fromJSON(data: { fieldDefs: CustomFieldDef[]; fieldValues: CustomFieldValue[] }): void {
    this.clear();
    
    data.fieldDefs.forEach(def => {
      if (typeof def.createdAt === 'string') {
        def.createdAt = new Date(def.createdAt);
      }
      if (typeof def.updatedAt === 'string') {
        def.updatedAt = new Date(def.updatedAt);
      }
      this.fieldDefs.set(def.id, def);
    });

    data.fieldValues.forEach(value => {
      if (typeof value.createdAt === 'string') {
        value.createdAt = new Date(value.createdAt);
      }
      if (typeof value.updatedAt === 'string') {
        value.updatedAt = new Date(value.updatedAt);
      }
      const key = `${value.fieldDefId}_${value.entityId}`;
      this.fieldValues.set(key, value);
    });
  }
}

export class CustomFieldRepository extends CustomFieldRepositoryImpl {}
export const customFieldRepository = new CustomFieldRepositoryImpl();