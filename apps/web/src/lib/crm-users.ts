// Mock user data for RBAC - matches TEST_USERS from enhanced-seeds.ts
export interface CRMUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export const CRM_USERS: Record<string, CRMUser> = {
  'admin-user-001': {
    id: 'admin-user-001',
    name: 'System Administrator',
    email: 'admin@unitedcars.com',
    initials: 'SA'
  },
  'senior-mgr-001': {
    id: 'senior-mgr-001',
    name: 'Sarah Johnson',
    email: 'sarah.j@unitedcars.com',
    initials: 'SJ'
  },
  'senior-mgr-002': {
    id: 'senior-mgr-002',
    name: 'Michael Chen',
    email: 'michael.c@unitedcars.com',
    initials: 'MC'
  },
  'junior-mgr-001': {
    id: 'junior-mgr-001',
    name: 'David Wilson',
    email: 'david.w@unitedcars.com',
    initials: 'DW'
  },
  'junior-mgr-002': {
    id: 'junior-mgr-002',
    name: 'Emma Rodriguez',
    email: 'emma.r@unitedcars.com',
    initials: 'ER'
  },
  // Development admin user (now same as production admin-user-001)
  'admin-dev-user': {
    id: 'admin-dev-user',
    name: 'System Administrator',
    email: 'admin@unitedcars.com',
    initials: 'SA'
  }
};

/**
 * Get user display name from user ID
 * Returns "Unknown User" if user not found
 */
export function getUserName(userId?: string): string {
  if (!userId) return 'Unassigned';
  const user = CRM_USERS[userId];
  return user ? user.name : 'Unknown User';
}

/**
 * Get user initials from user ID
 * Returns "?" if user not found
 */
export function getUserInitials(userId?: string): string {
  if (!userId) return '?';
  const user = CRM_USERS[userId];
  return user ? user.initials : '?';
}

/**
 * Get user email from user ID
 */
export function getUserEmail(userId?: string): string | undefined {
  if (!userId) return undefined;
  return CRM_USERS[userId]?.email;
}

/**
 * Get full user object from user ID
 */
export function getUser(userId?: string): CRMUser | undefined {
  if (!userId) return undefined;
  return CRM_USERS[userId];
}
