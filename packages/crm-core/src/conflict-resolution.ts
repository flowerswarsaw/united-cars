import { UniquenessConflict, ConflictResolution } from './uniqueness';

// UI state for conflict resolution modal
export interface ConflictResolutionState {
  isOpen: boolean;
  conflicts: UniquenessConflict[];
  entityType: string;
  entityId?: string;
  proposedData: Record<string, any>;
  resolutionOptions: ConflictResolutionOption[];
  selectedResolution?: ConflictResolution;
  isProcessing: boolean;
}

// Available resolution options for conflicts
export interface ConflictResolutionOption {
  id: string;
  type: ConflictResolution['action'];
  label: string;
  description: string;
  icon?: string;
  isDestructive?: boolean;
  requiresConfirmation?: boolean;
  requiresAdminRole?: boolean;
}

// Entity details for conflict display
export interface ConflictingEntityDetails {
  entityType: string;
  entityId: string;
  displayName: string;
  description: string;
  conflictingFields: Array<{
    field: string;
    value: string;
    verified: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: {
    id: string;
    name: string;
  };
}

// Conflict resolution manager
export class ConflictResolutionManager {
  
  // Generate resolution options based on conflict type and user role
  static generateResolutionOptions(
    conflicts: UniquenessConflict[],
    userRole: string,
    entityType: string
  ): ConflictResolutionOption[] {
    const options: ConflictResolutionOption[] = [];

    // Cancel option (always available)
    options.push({
      id: 'cancel',
      type: 'cancel',
      label: 'Cancel',
      description: 'Cancel this operation and keep existing data unchanged',
      icon: '❌'
    });

    // Keep both option (for most cases)
    options.push({
      id: 'keep_both',
      type: 'keep_both',
      label: 'Keep Both',
      description: 'Save both records with modified field values to avoid conflict',
      icon: '📋'
    });

    // Update existing option (if user has permission)
    if (userRole === 'admin' || conflicts.every(c => 
      c.conflictingEntities.some(e => !e.verified)
    )) {
      options.push({
        id: 'update_existing',
        type: 'update_existing',
        label: 'Update Existing',
        description: 'Update the existing record with new information',
        icon: '🔄',
        requiresConfirmation: true
      });
    }

    // Merge option (admin only, for contacts/organizations)
    if (userRole === 'admin' && (entityType === 'organisations' || entityType === 'contacts')) {
      options.push({
        id: 'merge',
        type: 'merge',
        label: 'Merge Records',
        description: 'Combine both records into one, keeping the best information from each',
        icon: '🔗',
        requiresConfirmation: true,
        requiresAdminRole: true,
        isDestructive: true
      });
    }

    return options;
  }

  // Generate suggested field modifications to resolve conflicts
  static generateFieldSuggestions(
    conflicts: UniquenessConflict[],
    proposedData: Record<string, any>
  ): Record<string, Array<{ suggestion: string; reason: string }>> {
    const suggestions: Record<string, Array<{ suggestion: string; reason: string }>> = {};

    for (const conflict of conflicts) {
      const field = conflict.field;
      const currentValue = proposedData[field];
      
      if (!suggestions[field]) {
        suggestions[field] = [];
      }

      switch (field) {
        case 'email':
          if (typeof currentValue === 'string' && currentValue.includes('@')) {
            const [username, domain] = currentValue.split('@');
            suggestions[field].push(
              { suggestion: `${username}+new@${domain}`, reason: 'Add +new to email username' },
              { suggestion: `${username}2@${domain}`, reason: 'Add number suffix to username' }
            );
          }
          break;

        case 'phone':
          if (typeof currentValue === 'string') {
            const digits = currentValue.replace(/\D/g, '');
            if (digits.length >= 10) {
              suggestions[field].push(
                { suggestion: `${currentValue} (ext. 1)`, reason: 'Add extension number' },
                { suggestion: `${currentValue} (mobile)`, reason: 'Add mobile designation' }
              );
            }
          }
          break;

        case 'companyId':
          if (typeof currentValue === 'string') {
            suggestions[field].push(
              { suggestion: `${currentValue}-1`, reason: 'Add numeric suffix' },
              { suggestion: `${currentValue}-NEW`, reason: 'Add NEW suffix' }
            );
          }
          break;

        default:
          if (typeof currentValue === 'string') {
            suggestions[field].push(
              { suggestion: `${currentValue} (2)`, reason: 'Add counter suffix' },
              { suggestion: `${currentValue}_new`, reason: 'Add _new suffix' }
            );
          }
      }
    }

    return suggestions;
  }

  // Validate resolution before applying
  static validateResolution(
    resolution: ConflictResolution,
    conflicts: UniquenessConflict[],
    userRole: string
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    switch (resolution.action) {
      case 'merge':
        if (userRole !== 'admin') {
          result.isValid = false;
          result.errors.push('Only administrators can merge records');
        }
        if (!resolution.primaryEntityId) {
          result.isValid = false;
          result.errors.push('Primary entity must be selected for merge operation');
        }
        break;

      case 'update_existing':
        if (!resolution.fieldUpdates || Object.keys(resolution.fieldUpdates).length === 0) {
          result.isValid = false;
          result.errors.push('Field updates are required for update existing operation');
        }
        // Check if any conflicting entities are verified and user isn't admin
        const hasVerifiedConflicts = conflicts.some(c => 
          c.conflictingEntities.some(e => e.verified)
        );
        if (hasVerifiedConflicts && userRole !== 'admin') {
          result.isValid = false;
          result.errors.push('Cannot update verified records without administrator privileges');
        }
        break;

      case 'keep_both':
        if (!resolution.fieldUpdates || Object.keys(resolution.fieldUpdates).length === 0) {
          result.warnings.push('No field modifications specified - conflicts may persist');
        }
        break;

      case 'cancel':
        // Always valid
        break;

      default:
        result.isValid = false;
        result.errors.push(`Unknown resolution action: ${resolution.action}`);
    }

    return result;
  }

  // Generate conflict summary for UI display
  static generateConflictSummary(conflicts: UniquenessConflict[]): {
    totalConflicts: number;
    fieldsCounts: Record<string, number>;
    hasVerifiedConflicts: boolean;
    affectedEntities: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const fieldsCounts: Record<string, number> = {};
    let hasVerifiedConflicts = false;
    const affectedEntityIds = new Set<string>();

    for (const conflict of conflicts) {
      fieldsCounts[conflict.field] = (fieldsCounts[conflict.field] || 0) + 1;
      
      for (const entity of conflict.conflictingEntities) {
        affectedEntityIds.add(`${entity.entityType}:${entity.entityId}`);
        if (entity.verified) {
          hasVerifiedConflicts = true;
        }
      }
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (hasVerifiedConflicts) {
      riskLevel = 'HIGH';
    } else if (conflicts.length > 2 || affectedEntityIds.size > 1) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalConflicts: conflicts.length,
      fieldsCounts,
      hasVerifiedConflicts,
      affectedEntities: affectedEntityIds.size,
      riskLevel
    };
  }

  // Format conflict message for display
  static formatConflictMessage(conflict: UniquenessConflict): string {
    const entityCount = conflict.conflictingEntities.length;
    const entityTypes = [...new Set(conflict.conflictingEntities.map(e => e.entityType))];
    
    if (entityCount === 1) {
      const entity = conflict.conflictingEntities[0];
      return `The ${conflict.field} "${conflict.value}" is already used by ${entity.entityType} ${entity.entityName || entity.entityId}`;
    } else {
      return `The ${conflict.field} "${conflict.value}" conflicts with ${entityCount} existing records across ${entityTypes.join(', ')}`;
    }
  }

  // Generate audit log entry for resolution
  static generateAuditLogEntry(
    resolution: ConflictResolution,
    conflicts: UniquenessConflict[],
    userId: string
  ): {
    action: string;
    description: string;
    affectedEntities: string[];
    riskLevel: string;
    timestamp: Date;
  } {
    const affectedEntities = conflicts.flatMap(c => 
      c.conflictingEntities.map(e => `${e.entityType}:${e.entityId}`)
    );
    
    const summary = this.generateConflictSummary(conflicts);
    
    return {
      action: resolution.action.toUpperCase(),
      description: this.getResolutionDescription(resolution, conflicts),
      affectedEntities: [...new Set(affectedEntities)],
      riskLevel: summary.riskLevel,
      timestamp: new Date()
    };
  }

  private static getResolutionDescription(
    resolution: ConflictResolution,
    conflicts: UniquenessConflict[]
  ): string {
    const fieldsList = conflicts.map(c => c.field).join(', ');
    
    switch (resolution.action) {
      case 'merge':
        return `Merged conflicting records due to duplicate ${fieldsList}`;
      case 'update_existing':
        return `Updated existing record to resolve conflicts in ${fieldsList}`;
      case 'keep_both':
        return `Modified field values to keep both records despite conflicts in ${fieldsList}`;
      case 'cancel':
        return `Cancelled operation due to unresolved conflicts in ${fieldsList}`;
      default:
        return `Applied ${resolution.action} resolution for conflicts in ${fieldsList}`;
    }
  }
}

// Hooks for conflict resolution state management
export interface UseConflictResolutionReturn {
  state: ConflictResolutionState;
  openConflictModal: (conflicts: UniquenessConflict[], entityType: string, proposedData: Record<string, any>) => void;
  closeConflictModal: () => void;
  selectResolution: (resolution: ConflictResolution) => void;
  applyResolution: () => Promise<{ success: boolean; error?: string }>;
  generateSuggestions: () => Record<string, Array<{ suggestion: string; reason: string }>>;
}

// Default conflict resolution state
export const defaultConflictResolutionState: ConflictResolutionState = {
  isOpen: false,
  conflicts: [],
  entityType: '',
  proposedData: {},
  resolutionOptions: [],
  isProcessing: false
};

// Conflict resolution result
export interface ConflictResolutionResult {
  success: boolean;
  action: ConflictResolution['action'];
  modifiedData?: Record<string, any>;
  mergedEntityId?: string;
  error?: string;
  warnings?: string[];
}