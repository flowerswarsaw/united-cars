import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth';
import {
  UserRole,
  canUserAccessEntity,
  CRMUserProfile,
  CustomRole,
  CRMUserWithRole,
  resolveUserPermissions,
  canCRMUserAccessEntity,
  customRoleToPermissions
} from '@united-cars/crm-core';

export interface CRMUser {
  id: string;
  email: string;
  orgId: string;
  tenantId: string;  // alias for orgId
  role: UserRole;
  roles: UserRole[];
}

/**
 * Enhanced CRM User with Profile and Custom Role
 * Used by new user management system
 */
export interface EnhancedCRMUser extends CRMUser {
  profile?: CRMUserProfile;
  customRole?: CustomRole;
  resolvedPermissions?: ReturnType<typeof resolveUserPermissions>;
}

/**
 * Extract authenticated user from request session
 * Returns 401 error response if not authenticated
 */
export async function getCRMUser(request: NextRequest): Promise<CRMUser | NextResponse> {
  const session = await getServerSessionFromRequest(request);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    );
  }

  const user = session.user;

  // Map platform user to CRM user
  const crmRole = mapToCRMRole(user.roles);

  return {
    id: user.id,
    email: user.email,
    orgId: user.orgId,
    tenantId: user.orgId,  // orgId is the tenantId
    role: crmRole,
    roles: [crmRole]
  };
}

/**
 * Get enhanced CRM user with profile and custom role
 * Returns full CRM user profile with resolved permissions
 *
 * NOTE: This function will be fully functional once repository implementations are added
 * For now, it returns a basic CRM user if profile is not found
 */
export async function getEnhancedCRMUser(
  request: NextRequest,
  crmUserRepo?: any,  // TODO: Type as CRMUserRepository once implemented
  customRoleRepo?: any  // TODO: Type as CustomRoleRepository once implemented
): Promise<EnhancedCRMUser | NextResponse> {
  // Get base CRM user
  const baseUserOrError = await getCRMUser(request);
  if (baseUserOrError instanceof NextResponse) {
    return baseUserOrError;
  }
  const baseUser = baseUserOrError;

  // If repositories not provided, return base user (backward compatibility)
  if (!crmUserRepo || !customRoleRepo) {
    return baseUser;
  }

  try {
    // Fetch CRM profile by platform user ID
    const profile = await crmUserRepo.getByPlatformUserId(baseUser.id);

    if (!profile) {
      // No CRM profile found - return base user
      // In production, you might want to auto-create profile here using UserSyncService
      console.warn(`No CRM profile found for platform user ${baseUser.id}`);
      return baseUser;
    }

    // Fetch custom role
    const customRole = await customRoleRepo.get(profile.customRoleId);

    if (!customRole) {
      console.error(`Custom role ${profile.customRoleId} not found for user ${profile.id}`);
      return baseUser;
    }

    // Resolve final permissions
    const resolvedPermissions = resolveUserPermissions(
      {
        id: profile.id,
        customRoleId: profile.customRoleId,
        permissionOverrides: profile.permissionOverrides
      },
      customRoleToPermissions(customRole)
    );

    // Return enhanced user
    return {
      ...baseUser,
      profile,
      customRole,
      resolvedPermissions
    };
  } catch (error) {
    console.error('Error fetching CRM user profile:', error);
    // Fallback to base user on error
    return baseUser;
  }
}

/**
 * Map platform roles to CRM role
 * Default to junior_sales_manager if no specific role found
 */
function mapToCRMRole(platformRoles: string[]): UserRole {
  // Convert roles to lowercase for case-insensitive matching
  const lowerRoles = platformRoles.map(r => r.toLowerCase());

  if (lowerRoles.includes('admin')) return UserRole.ADMIN;
  if (lowerRoles.includes('senior_sales_manager')) return UserRole.SENIOR_SALES_MANAGER;
  return UserRole.JUNIOR_SALES_MANAGER;  // Default
}

// RBAC entity type mapping for type safety
type RBACEntityType = 'organisations' | 'contacts' | 'deals' | 'leads' | 'tasks' | 'pipelines' | 'contracts' | 'calls';
type EntityTypeName = 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Task' | 'Pipeline' | 'Stage' | 'Contract' | 'Call';

const ENTITY_TYPE_MAP: Record<EntityTypeName, RBACEntityType> = {
  'Organisation': 'organisations',
  'Contact': 'contacts',
  'Deal': 'deals',
  'Lead': 'leads',
  'Task': 'tasks',
  'Pipeline': 'pipelines',
  'Stage': 'pipelines', // Stages use pipeline permissions
  'Contract': 'contracts',
  'Call': 'calls'
} as const;

/**
 * Check if user can perform operation on entity
 * Returns 403 error response if access denied, true if access granted
 */
export function checkEntityAccess(
  user: CRMUser,
  entityType: EntityTypeName,
  operation: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
  entityAssignedUserId?: string
): boolean | NextResponse {
  const rbacEntityType = ENTITY_TYPE_MAP[entityType];

  const hasAccess = canUserAccessEntity(
    { id: user.id, role: user.role },
    rbacEntityType,
    operation,
    undefined,
    entityAssignedUserId
  );

  if (!hasAccess) {
    return NextResponse.json(
      { error: `Access denied - Insufficient permissions to ${operation} ${entityType}` },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Filter array of entities by user access
 * Removes entities user shouldn't see based on role + assignment
 */
export function filterByUserAccess<T extends { assignedUserId?: string; responsibleUserId?: string; createdBy?: string }>(
  items: T[],
  user: CRMUser,
  entityType: 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Contract' | 'Call'
): T[] {
  // Admin and Senior Managers see everything in their tenant
  if (user.role === UserRole.ADMIN || user.role === UserRole.SENIOR_SALES_MANAGER) {
    return items;
  }

  // Junior managers see only assigned items
  return items.filter(item => {
    const assignedTo = item.responsibleUserId || item.assignedUserId;
    return assignedTo === user.id || item.createdBy === user.id;
  });
}
