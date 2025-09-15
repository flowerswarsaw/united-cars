export interface UniquenessConstraint {
  field: string;
  entityType: string;
  entityId: string;
  value: string;
  normalizedValue: string; // Lowercase, trimmed version for comparison
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UniquenessConflict {
  field: string;
  value: string;
  conflictingEntities: Array<{
    entityType: string;
    entityId: string;
    entityName?: string;
    verified?: boolean;
  }>;
}

export interface ConflictResolution {
  action: 'merge' | 'keep_both' | 'update_existing' | 'cancel';
  primaryEntityId?: string; // For merge action
  fieldUpdates?: Record<string, any>; // For update_existing action
}

export class UniquenessManager {
  private constraints = new Map<string, UniquenessConstraint>();

  // Generate a unique key for the constraint
  private getConstraintKey(field: string, normalizedValue: string): string {
    return `${field}:${normalizedValue}`;
  }

  // Normalize value for comparison (lowercase, trim)
  private normalizeValue(value: string): string {
    return value.toLowerCase().trim();
  }

  // Add or update a uniqueness constraint
  addConstraint(
    field: string,
    entityType: string,
    entityId: string,
    value: string,
    verified?: boolean
  ): void {
    if (!value || !value.trim()) return;

    const normalizedValue = this.normalizeValue(value);
    const key = this.getConstraintKey(field, normalizedValue);
    
    const constraint: UniquenessConstraint = {
      field,
      entityType,
      entityId,
      value: value.trim(),
      normalizedValue,
      verified,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.constraints.set(key, constraint);
  }

  // Remove constraints for an entity
  removeConstraintsForEntity(entityType: string, entityId: string): void {
    for (const [key, constraint] of this.constraints.entries()) {
      if (constraint.entityType === entityType && constraint.entityId === entityId) {
        this.constraints.delete(key);
      }
    }
  }

  // Check for conflicts when adding/updating a value
  checkConflicts(
    field: string,
    value: string,
    excludeEntityId?: string,
    excludeEntityType?: string
  ): UniquenessConflict | null {
    if (!value || !value.trim()) return null;

    const normalizedValue = this.normalizeValue(value);
    const key = this.getConstraintKey(field, normalizedValue);
    
    const existingConstraint = this.constraints.get(key);
    
    if (existingConstraint && 
        !(existingConstraint.entityId === excludeEntityId && 
          existingConstraint.entityType === excludeEntityType)) {
      
      return {
        field,
        value: value.trim(),
        conflictingEntities: [{
          entityType: existingConstraint.entityType,
          entityId: existingConstraint.entityId,
          verified: existingConstraint.verified
        }]
      };
    }

    return null;
  }

  // Get all constraints for debugging/admin purposes
  getAllConstraints(): UniquenessConstraint[] {
    return Array.from(this.constraints.values());
  }

  // Update verification status
  updateVerificationStatus(field: string, value: string, verified: boolean): void {
    const normalizedValue = this.normalizeValue(value);
    const key = this.getConstraintKey(field, normalizedValue);
    const constraint = this.constraints.get(key);
    
    if (constraint) {
      constraint.verified = verified;
      constraint.updatedAt = new Date();
      this.constraints.set(key, constraint);
    }
  }

  // Serialize for persistence
  toJSON(): UniquenessConstraint[] {
    return Array.from(this.constraints.values());
  }

  // Deserialize from persistence
  fromJSON(data: UniquenessConstraint[]): void {
    this.constraints.clear();
    data.forEach(constraint => {
      // Convert date strings back to Date objects
      if (typeof constraint.createdAt === 'string') {
        constraint.createdAt = new Date(constraint.createdAt);
      }
      if (typeof constraint.updatedAt === 'string') {
        constraint.updatedAt = new Date(constraint.updatedAt);
      }
      
      const key = this.getConstraintKey(constraint.field, constraint.normalizedValue);
      this.constraints.set(key, constraint);
    });
  }

  // Clear all constraints
  clear(): void {
    this.constraints.clear();
  }
}

// Global uniqueness manager instance
export const uniquenessManager = new UniquenessManager();

// Fields that should be checked for uniqueness across entities
export const UNIQUENESS_FIELDS = {
  phone: ['organisations', 'contacts'],
  email: ['organisations', 'contacts'],
  'socialMediaLinks.url': ['organisations', 'contacts'],
  companyId: ['organisations'],
  taxId: ['organisations']
} as const;

export type UniquenessField = keyof typeof UNIQUENESS_FIELDS;