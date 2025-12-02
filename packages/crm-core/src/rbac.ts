export enum UserRole {
  ADMIN = 'admin',
  SENIOR_SALES_MANAGER = 'senior_sales_manager',
  JUNIOR_SALES_MANAGER = 'junior_sales_manager'
}

export interface RBACUser {
  id: string;
  role: UserRole;
  assignedEntityIds?: string[]; // For managers - specific entities they can manage
}

export interface EntityPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReadAll: boolean; // Can read entities not assigned to them
}

export interface RBACPermissions {
  organisations: EntityPermissions;
  contacts: EntityPermissions;
  deals: EntityPermissions;
  leads: EntityPermissions;
  tasks: EntityPermissions;
  pipelines: EntityPermissions;
  contracts: EntityPermissions;
}

export function getUserPermissions(role: UserRole): RBACPermissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        organisations: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        contacts: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        deals: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        leads: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        tasks: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        pipelines: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true },
        contracts: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true }
      };

    case UserRole.SENIOR_SALES_MANAGER:
      return {
        organisations: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        contacts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        deals: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        leads: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        tasks: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        contracts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true }
      };

    case UserRole.JUNIOR_SALES_MANAGER:
      return {
        organisations: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only read assigned via deals/leads
        contacts: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only read assigned via deals/leads
        deals: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        leads: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        tasks: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        contracts: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false } // Can only manage assigned
      };

    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

export function canUserAccessEntity(
  user: RBACUser,
  entityType: keyof RBACPermissions,
  operation: keyof EntityPermissions,
  entityId?: string,
  entityAssignedUserId?: string
): boolean {
  const permissions = getUserPermissions(user.role);
  const entityPermissions = permissions[entityType];

  // Check basic permission
  if (!entityPermissions[operation]) {
    return false;
  }

  // For read operations, check if user can read all or if entity is assigned to them
  if (operation === 'canRead' || operation === 'canReadAll') {
    if (entityPermissions.canReadAll) {
      return true;
    }

    // For non-admin users, check if entity is assigned to them or if they created it
    if (entityId && (
      user.assignedEntityIds?.includes(entityId) ||
      entityAssignedUserId === user.id
    )) {
      return true;
    }

    return false;
  }

  // For update/delete operations on deals/leads/tasks/contracts, check assignment
  if ((operation === 'canUpdate' || operation === 'canDelete') &&
      (entityType === 'deals' || entityType === 'leads' || entityType === 'tasks' || entityType === 'contracts')) {

    // Admins can do anything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // For managers, they can only update/delete entities assigned to them
    if (entityId && (
      user.assignedEntityIds?.includes(entityId) ||
      entityAssignedUserId === user.id
    )) {
      return true;
    }

    return false;
  }

  return true;
}

// ============================================================================
// ENHANCED RBAC - Custom Roles & Permission Resolution
// ============================================================================

/**
 * CRM User with Custom Role - Enhanced user type for new RBAC system
 */
export interface CRMRBACUser {
  id: string;
  customRoleId: string;
  permissionOverrides?: {
    organisations?: Partial<EntityPermissions>;
    contacts?: Partial<EntityPermissions>;
    deals?: Partial<EntityPermissions>;
    leads?: Partial<EntityPermissions>;
    tasks?: Partial<EntityPermissions>;
    pipelines?: Partial<EntityPermissions>;
    contracts?: Partial<EntityPermissions>;
  };
  assignedEntityIds?: string[];
}

/**
 * Custom Role with Permissions
 */
export interface CustomRolePermissions {
  permissions: RBACPermissions;
}

/**
 * Resolve final user permissions by merging role permissions with user overrides
 *
 * Priority:
 * 1. User permission overrides (highest)
 * 2. Custom role permissions (fallback)
 *
 * @param crmUser - CRM user with custom role and optional overrides
 * @param customRole - The user's assigned custom role with permissions
 * @returns Resolved permissions with overrides applied
 */
export function resolveUserPermissions(
  crmUser: CRMRBACUser,
  customRole: CustomRolePermissions
): RBACPermissions {
  const basePermissions = customRole.permissions;
  const overrides = crmUser.permissionOverrides;

  // If no overrides, return role permissions as-is
  if (!overrides) {
    return basePermissions;
  }

  // Merge overrides with base permissions
  const resolved: RBACPermissions = {
    organisations: {
      ...basePermissions.organisations,
      ...overrides.organisations
    },
    contacts: {
      ...basePermissions.contacts,
      ...overrides.contacts
    },
    deals: {
      ...basePermissions.deals,
      ...overrides.deals
    },
    leads: {
      ...basePermissions.leads,
      ...overrides.leads
    },
    tasks: {
      ...basePermissions.tasks,
      ...overrides.tasks
    },
    pipelines: {
      ...basePermissions.pipelines,
      ...overrides.pipelines
    },
    contracts: {
      ...basePermissions.contracts,
      ...overrides.contracts
    }
  };

  return resolved;
}

/**
 * Check if a CRM user can access an entity based on custom role and overrides
 *
 * @param crmUser - CRM user with custom role and optional overrides
 * @param customRole - The user's assigned custom role
 * @param entityType - Type of entity to check access for
 * @param operation - Permission operation to check
 * @param entityId - Optional entity ID for assignment checks
 * @param entityAssignedUserId - Optional user ID of entity assignee
 * @returns True if user has permission
 */
export function canCRMUserAccessEntity(
  crmUser: CRMRBACUser,
  customRole: CustomRolePermissions,
  entityType: keyof RBACPermissions,
  operation: keyof EntityPermissions,
  entityId?: string,
  entityAssignedUserId?: string
): boolean {
  // Resolve final permissions
  const permissions = resolveUserPermissions(crmUser, customRole);
  const entityPermissions = permissions[entityType];

  // Check basic permission
  if (!entityPermissions[operation]) {
    return false;
  }

  // For read operations, check if user can read all or if entity is assigned to them
  if (operation === 'canRead' || operation === 'canReadAll') {
    if (entityPermissions.canReadAll) {
      return true;
    }

    // For users without canReadAll, check if entity is assigned to them
    if (entityId && (
      crmUser.assignedEntityIds?.includes(entityId) ||
      entityAssignedUserId === crmUser.id
    )) {
      return true;
    }

    return false;
  }

  // For update/delete operations on deals/leads/tasks/contracts, check assignment if needed
  if ((operation === 'canUpdate' || operation === 'canDelete') &&
      (entityType === 'deals' || entityType === 'leads' || entityType === 'tasks' || entityType === 'contracts')) {

    // If user has the permission, they still might need assignment check
    // This depends on whether they have canReadAll (full access) or not (limited access)
    if (entityPermissions.canReadAll) {
      // Full access - can update/delete any entity
      return true;
    }

    // Limited access - can only update/delete entities assigned to them
    if (entityId && (
      crmUser.assignedEntityIds?.includes(entityId) ||
      entityAssignedUserId === crmUser.id
    )) {
      return true;
    }

    return false;
  }

  return true;
}

/**
 * Helper to convert CustomRole to CustomRolePermissions interface
 */
export function customRoleToPermissions(role: {
  permissions: {
    organisations: EntityPermissions;
    contacts: EntityPermissions;
    deals: EntityPermissions;
    leads: EntityPermissions;
    tasks: EntityPermissions;
    pipelines: EntityPermissions;
    contracts: EntityPermissions;
  };
}): CustomRolePermissions {
  return {
    permissions: role.permissions
  };
}