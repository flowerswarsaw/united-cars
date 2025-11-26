/**
 * User Management Initialization
 *
 * Ensures user management seed data is loaded into repositories.
 * This module is imported by the repository files to guarantee initialization.
 */

let initialized = false;

export function initUserManagement() {
  if (initialized) return;

  try {
    // Import repositories and seed data
    const { crmUserRepository } = require('./repositories/crm-user-repository');
    const { customRoleRepository } = require('./repositories/custom-role-repository');
    const { teamRepository } = require('./repositories/team-repository');
    const { USER_MANAGEMENT_SEEDS } = require('./user-management-seeds');

    // Load roles
    customRoleRepository.fromJSON(USER_MANAGEMENT_SEEDS.roles || []);

    // Load users
    crmUserRepository.fromJSON(USER_MANAGEMENT_SEEDS.users || []);

    // Load teams
    teamRepository.fromJSON(USER_MANAGEMENT_SEEDS.teams || []);
    teamRepository.initializeMemberships(USER_MANAGEMENT_SEEDS.teamMemberships || []);

    initialized = true;
  } catch (error) {
    console.error('[CRM-MOCKS] Failed to initialize user management:', error);
    throw error;
  }
}

// Auto-initialize on server-side
if (typeof window === 'undefined') {
  initUserManagement();
}
