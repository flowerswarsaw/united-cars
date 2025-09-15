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
        pipelines: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canReadAll: true }
      };

    case UserRole.SENIOR_SALES_MANAGER:
      return {
        organisations: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        contacts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        deals: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        leads: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        tasks: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }, // Can only update assigned
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }
      };

    case UserRole.JUNIOR_SALES_MANAGER:
      return {
        organisations: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only read assigned via deals/leads
        contacts: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only read assigned via deals/leads
        deals: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        leads: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        tasks: { canCreate: true, canRead: false, canUpdate: false, canDelete: false, canReadAll: false }, // Can only manage assigned
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true }
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

  // For update/delete operations on deals/leads/tasks, check assignment
  if ((operation === 'canUpdate' || operation === 'canDelete') && 
      (entityType === 'deals' || entityType === 'leads' || entityType === 'tasks')) {
    
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