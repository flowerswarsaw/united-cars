/**
 * User Management Seed Data
 *
 * Provides initial seed data for the CRM user management system:
 * - System roles (migrated from hardcoded RBAC roles)
 * - CRM user profiles (linked to platform users)
 * - Teams and hierarchies
 */

import {
  CustomRole,
  CRMUserProfile,
  Team,
  TeamMembership,
  CRMUserStatus,
  TeamMemberRole
} from '@united-cars/crm-core';

const DEFAULT_TENANT = 'org-admin';

// ============================================================================
// SYSTEM ROLES - Migrated from hardcoded RBAC
// ============================================================================

/**
 * System Role: CRM Administrator
 * Full access to all CRM entities and administrative functions
 */
export const SYSTEM_ROLE_ADMIN: CustomRole = {
  id: 'role-system-admin',
  tenantId: DEFAULT_TENANT,
  name: 'CRM Administrator',
  description: 'Full administrative access to all CRM entities and settings. Can manage users, roles, and perform all CRUD operations.',
  color: '#DC2626', // Red
  isSystem: true, // Cannot be deleted
  permissions: {
    organisations: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    },
    contacts: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    },
    deals: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    },
    leads: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    },
    tasks: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    },
    pipelines: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canReadAll: true
    }
  },
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'system',
  updatedBy: 'system'
};

/**
 * System Role: Senior Sales Manager
 * Can view all entities, manage organizations and contacts, but can only update assigned deals/leads/tasks
 */
export const SYSTEM_ROLE_SENIOR_SALES_MANAGER: CustomRole = {
  id: 'role-system-senior-sales',
  tenantId: DEFAULT_TENANT,
  name: 'Senior Sales Manager',
  description: 'Experienced sales professional with broad visibility. Can manage organizations and contacts, view all deals/leads, but can only update assigned ones.',
  color: '#2563EB', // Blue
  isSystem: true,
  permissions: {
    organisations: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
      canReadAll: true
    },
    contacts: {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
      canReadAll: true
    },
    deals: {
      canCreate: true,
      canRead: true,
      canUpdate: false, // Can only update assigned deals
      canDelete: false,
      canReadAll: true
    },
    leads: {
      canCreate: true,
      canRead: true,
      canUpdate: false, // Can only update assigned leads
      canDelete: false,
      canReadAll: true
    },
    tasks: {
      canCreate: true,
      canRead: true,
      canUpdate: false, // Can only update assigned tasks
      canDelete: false,
      canReadAll: true
    },
    pipelines: {
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
      canReadAll: true
    }
  },
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'system',
  updatedBy: 'system'
};

/**
 * System Role: Junior Sales Manager
 * Limited visibility - can only view and manage entities assigned to them
 */
export const SYSTEM_ROLE_JUNIOR_SALES_MANAGER: CustomRole = {
  id: 'role-system-junior-sales',
  tenantId: DEFAULT_TENANT,
  name: 'Junior Sales Manager',
  description: 'Entry-level sales role with limited access. Can only view and manage entities assigned to them. Can create new organizations and contacts.',
  color: '#16A34A', // Green
  isSystem: true,
  permissions: {
    organisations: {
      canCreate: true,
      canRead: false, // Can only read assigned via deals/leads
      canUpdate: false,
      canDelete: false,
      canReadAll: false
    },
    contacts: {
      canCreate: true,
      canRead: false, // Can only read assigned via deals/leads
      canUpdate: false,
      canDelete: false,
      canReadAll: false
    },
    deals: {
      canCreate: true,
      canRead: false, // Can only read assigned
      canUpdate: false, // Can only update assigned
      canDelete: false,
      canReadAll: false
    },
    leads: {
      canCreate: true,
      canRead: false, // Can only read assigned
      canUpdate: false, // Can only update assigned
      canDelete: false,
      canReadAll: false
    },
    tasks: {
      canCreate: true,
      canRead: false, // Can only read assigned
      canUpdate: false, // Can only update assigned
      canDelete: false,
      canReadAll: false
    },
    pipelines: {
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
      canReadAll: true // Everyone can see pipelines
    }
  },
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'system',
  updatedBy: 'system'
};

export const SYSTEM_ROLES = [
  SYSTEM_ROLE_ADMIN,
  SYSTEM_ROLE_SENIOR_SALES_MANAGER,
  SYSTEM_ROLE_JUNIOR_SALES_MANAGER
];

// ============================================================================
// CRM USER PROFILES - Linked to platform users
// ============================================================================

/**
 * CRM Profile: System Administrator
 * Linked to platform user: admin-user-001
 */
export const CRM_USER_ADMIN: CRMUserProfile = {
  id: 'crm-user-admin-001',
  tenantId: DEFAULT_TENANT,
  platformUserId: 'admin-user-001',
  displayName: 'System Administrator',
  email: 'admin@unitedcars.com',
  avatar: undefined,
  title: 'CRM System Administrator',
  department: 'IT & Operations',
  customRoleId: SYSTEM_ROLE_ADMIN.id,
  permissionOverrides: undefined,
  managerId: undefined, // No manager - top of hierarchy
  teamIds: [],
  status: CRMUserStatus.ACTIVE,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  createdBy: 'system',
  updatedBy: 'system'
};

/**
 * CRM Profile: Senior Sales Manager
 * Linked to platform user: senior-mgr-001
 */
export const CRM_USER_SENIOR_MANAGER_1: CRMUserProfile = {
  id: 'crm-user-senior-001',
  tenantId: DEFAULT_TENANT,
  platformUserId: 'senior-mgr-001',
  displayName: 'Sarah Johnson',
  email: 'sarah.j@unitedcars.com',
  avatar: undefined,
  title: 'Senior Sales Manager',
  department: 'Sales',
  customRoleId: SYSTEM_ROLE_SENIOR_SALES_MANAGER.id,
  permissionOverrides: undefined,
  managerId: CRM_USER_ADMIN.id,
  teamIds: [],
  status: CRMUserStatus.ACTIVE,
  isActive: true,
  createdAt: new Date('2024-01-10T00:00:00Z'),
  updatedAt: new Date('2024-01-10T00:00:00Z'),
  createdBy: CRM_USER_ADMIN.id,
  updatedBy: CRM_USER_ADMIN.id
};

/**
 * CRM Profile: Senior Sales Manager #2
 * Linked to platform user: senior-mgr-002
 */
export const CRM_USER_SENIOR_MANAGER_2: CRMUserProfile = {
  id: 'crm-user-senior-002',
  tenantId: DEFAULT_TENANT,
  platformUserId: 'senior-mgr-002',
  displayName: 'Michael Chen',
  email: 'michael.c@unitedcars.com',
  avatar: undefined,
  title: 'Senior Sales Manager',
  department: 'Sales',
  customRoleId: SYSTEM_ROLE_SENIOR_SALES_MANAGER.id,
  permissionOverrides: undefined,
  managerId: CRM_USER_ADMIN.id,
  teamIds: [],
  status: CRMUserStatus.ACTIVE,
  isActive: true,
  createdAt: new Date('2024-01-12T00:00:00Z'),
  updatedAt: new Date('2024-01-12T00:00:00Z'),
  createdBy: CRM_USER_ADMIN.id,
  updatedBy: CRM_USER_ADMIN.id
};

/**
 * CRM Profile: Junior Sales Manager
 * Linked to platform user: junior-mgr-001
 */
export const CRM_USER_JUNIOR_MANAGER_1: CRMUserProfile = {
  id: 'crm-user-junior-001',
  tenantId: DEFAULT_TENANT,
  platformUserId: 'junior-mgr-001',
  displayName: 'David Wilson',
  email: 'david.w@unitedcars.com',
  avatar: undefined,
  title: 'Junior Sales Manager',
  department: 'Sales',
  customRoleId: SYSTEM_ROLE_JUNIOR_SALES_MANAGER.id,
  permissionOverrides: undefined,
  managerId: CRM_USER_SENIOR_MANAGER_1.id,
  teamIds: [],
  status: CRMUserStatus.ACTIVE,
  isActive: true,
  createdAt: new Date('2024-01-15T00:00:00Z'),
  updatedAt: new Date('2024-01-15T00:00:00Z'),
  createdBy: CRM_USER_SENIOR_MANAGER_1.id,
  updatedBy: CRM_USER_SENIOR_MANAGER_1.id
};

/**
 * CRM Profile: Junior Sales Manager #2
 * Linked to platform user: junior-mgr-002
 */
export const CRM_USER_JUNIOR_MANAGER_2: CRMUserProfile = {
  id: 'crm-user-junior-002',
  tenantId: DEFAULT_TENANT,
  platformUserId: 'junior-mgr-002',
  displayName: 'Emma Rodriguez',
  email: 'emma.r@unitedcars.com',
  avatar: undefined,
  title: 'Junior Sales Manager',
  department: 'Sales',
  customRoleId: SYSTEM_ROLE_JUNIOR_SALES_MANAGER.id,
  permissionOverrides: undefined,
  managerId: CRM_USER_SENIOR_MANAGER_2.id,
  teamIds: [],
  status: CRMUserStatus.ACTIVE,
  isActive: true,
  createdAt: new Date('2024-01-18T00:00:00Z'),
  updatedAt: new Date('2024-01-18T00:00:00Z'),
  createdBy: CRM_USER_SENIOR_MANAGER_2.id,
  updatedBy: CRM_USER_SENIOR_MANAGER_2.id
};

export const CRM_USERS = [
  CRM_USER_ADMIN,
  CRM_USER_SENIOR_MANAGER_1,
  CRM_USER_SENIOR_MANAGER_2,
  CRM_USER_JUNIOR_MANAGER_1,
  CRM_USER_JUNIOR_MANAGER_2
];

// ============================================================================
// TEAMS - Organizational groupings
// ============================================================================

/**
 * Team: East Coast Sales
 * Led by Sarah Johnson (Senior Manager)
 */
export const TEAM_EAST_COAST: Team = {
  id: 'team-east-coast',
  tenantId: DEFAULT_TENANT,
  name: 'East Coast Sales',
  description: 'Sales team covering the Eastern United States region',
  color: '#3B82F6', // Blue
  leaderId: CRM_USER_SENIOR_MANAGER_1.id,
  isActive: true,
  createdAt: new Date('2024-01-20T00:00:00Z'),
  updatedAt: new Date('2024-01-20T00:00:00Z'),
  createdBy: CRM_USER_ADMIN.id,
  updatedBy: CRM_USER_ADMIN.id
};

/**
 * Team: West Coast Sales
 * Led by Michael Chen (Senior Manager)
 */
export const TEAM_WEST_COAST: Team = {
  id: 'team-west-coast',
  tenantId: DEFAULT_TENANT,
  name: 'West Coast Sales',
  description: 'Sales team covering the Western United States region',
  color: '#8B5CF6', // Purple
  leaderId: CRM_USER_SENIOR_MANAGER_2.id,
  isActive: true,
  createdAt: new Date('2024-01-20T00:00:00Z'),
  updatedAt: new Date('2024-01-20T00:00:00Z'),
  createdBy: CRM_USER_ADMIN.id,
  updatedBy: CRM_USER_ADMIN.id
};

/**
 * Team: Sales Leadership
 * Executive team with both senior managers
 */
export const TEAM_LEADERSHIP: Team = {
  id: 'team-leadership',
  tenantId: DEFAULT_TENANT,
  name: 'Sales Leadership',
  description: 'Executive sales leadership team',
  color: '#DC2626', // Red
  leaderId: CRM_USER_ADMIN.id,
  isActive: true,
  createdAt: new Date('2024-01-20T00:00:00Z'),
  updatedAt: new Date('2024-01-20T00:00:00Z'),
  createdBy: CRM_USER_ADMIN.id,
  updatedBy: CRM_USER_ADMIN.id
};

export const TEAMS = [
  TEAM_EAST_COAST,
  TEAM_WEST_COAST,
  TEAM_LEADERSHIP
];

// ============================================================================
// TEAM MEMBERSHIPS
// ============================================================================

export const TEAM_MEMBERSHIPS: TeamMembership[] = [
  // East Coast Team
  {
    id: 'tm-east-1',
    teamId: TEAM_EAST_COAST.id,
    userId: CRM_USER_SENIOR_MANAGER_1.id,
    role: TeamMemberRole.LEADER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },
  {
    id: 'tm-east-2',
    teamId: TEAM_EAST_COAST.id,
    userId: CRM_USER_JUNIOR_MANAGER_1.id,
    role: TeamMemberRole.MEMBER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },

  // West Coast Team
  {
    id: 'tm-west-1',
    teamId: TEAM_WEST_COAST.id,
    userId: CRM_USER_SENIOR_MANAGER_2.id,
    role: TeamMemberRole.LEADER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },
  {
    id: 'tm-west-2',
    teamId: TEAM_WEST_COAST.id,
    userId: CRM_USER_JUNIOR_MANAGER_2.id,
    role: TeamMemberRole.MEMBER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },

  // Leadership Team
  {
    id: 'tm-leadership-1',
    teamId: TEAM_LEADERSHIP.id,
    userId: CRM_USER_ADMIN.id,
    role: TeamMemberRole.LEADER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },
  {
    id: 'tm-leadership-2',
    teamId: TEAM_LEADERSHIP.id,
    userId: CRM_USER_SENIOR_MANAGER_1.id,
    role: TeamMemberRole.MEMBER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  },
  {
    id: 'tm-leadership-3',
    teamId: TEAM_LEADERSHIP.id,
    userId: CRM_USER_SENIOR_MANAGER_2.id,
    role: TeamMemberRole.MEMBER,
    joinedAt: new Date('2024-01-20T00:00:00Z'),
    tenantId: DEFAULT_TENANT
  }
];

// Update CRM users with team IDs
CRM_USER_SENIOR_MANAGER_1.teamIds = [TEAM_EAST_COAST.id, TEAM_LEADERSHIP.id];
CRM_USER_SENIOR_MANAGER_2.teamIds = [TEAM_WEST_COAST.id, TEAM_LEADERSHIP.id];
CRM_USER_JUNIOR_MANAGER_1.teamIds = [TEAM_EAST_COAST.id];
CRM_USER_JUNIOR_MANAGER_2.teamIds = [TEAM_WEST_COAST.id];
CRM_USER_ADMIN.teamIds = [TEAM_LEADERSHIP.id];

// ============================================================================
// EXPORT ALL SEED DATA
// ============================================================================

export const USER_MANAGEMENT_SEEDS = {
  roles: SYSTEM_ROLES,
  users: CRM_USERS,
  teams: TEAMS,
  teamMemberships: TEAM_MEMBERSHIPS
};
