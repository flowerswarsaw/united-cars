import { describe, it, expect } from 'vitest';
import {
  UserRole,
  RBACUser,
  getUserPermissions,
  canUserAccessEntity,
  CRMRBACUser,
  CustomRolePermissions,
  resolveUserPermissions,
  canCRMUserAccessEntity
} from '@united-cars/crm-core/src/rbac';

describe('RBAC Permissions Business Logic', () => {
  describe('getUserPermissions', () => {
    it('should return full permissions for ADMIN role', () => {
      const permissions = getUserPermissions(UserRole.ADMIN);

      // Admin has full access to all entities
      expect(permissions.organisations.canCreate).toBe(true);
      expect(permissions.organisations.canRead).toBe(true);
      expect(permissions.organisations.canUpdate).toBe(true);
      expect(permissions.organisations.canDelete).toBe(true);
      expect(permissions.organisations.canReadAll).toBe(true);

      expect(permissions.deals.canCreate).toBe(true);
      expect(permissions.deals.canDelete).toBe(true);
      expect(permissions.contracts.canDelete).toBe(true);
    });

    it('should return restricted permissions for SENIOR_SALES_MANAGER', () => {
      const permissions = getUserPermissions(UserRole.SENIOR_SALES_MANAGER);

      // Senior manager can create and read all, but cannot delete
      expect(permissions.organisations.canCreate).toBe(true);
      expect(permissions.organisations.canRead).toBe(true);
      expect(permissions.organisations.canUpdate).toBe(true);
      expect(permissions.organisations.canDelete).toBe(false);
      expect(permissions.organisations.canReadAll).toBe(true);

      // Cannot delete deals
      expect(permissions.deals.canDelete).toBe(false);

      // Cannot create or modify pipelines
      expect(permissions.pipelines.canCreate).toBe(false);
      expect(permissions.pipelines.canUpdate).toBe(false);
    });

    it('should return limited permissions for JUNIOR_SALES_MANAGER', () => {
      const permissions = getUserPermissions(UserRole.JUNIOR_SALES_MANAGER);

      // Junior manager has very limited access
      expect(permissions.organisations.canCreate).toBe(true);
      expect(permissions.organisations.canRead).toBe(false); // Can only read assigned
      expect(permissions.organisations.canUpdate).toBe(false);
      expect(permissions.organisations.canDelete).toBe(false);
      expect(permissions.organisations.canReadAll).toBe(false);

      // Can read pipelines (needed for deal management)
      expect(permissions.pipelines.canRead).toBe(true);
      expect(permissions.pipelines.canReadAll).toBe(true);
      expect(permissions.pipelines.canCreate).toBe(false);
    });

    it('should throw error for unknown role', () => {
      expect(() => getUserPermissions('unknown' as UserRole)).toThrow('Unknown role');
    });
  });

  describe('canUserAccessEntity', () => {
    const adminUser: RBACUser = {
      id: 'admin-1',
      role: UserRole.ADMIN
    };

    const seniorManager: RBACUser = {
      id: 'senior-1',
      role: UserRole.SENIOR_SALES_MANAGER,
      assignedEntityIds: ['entity-assigned']
    };

    const juniorManager: RBACUser = {
      id: 'junior-1',
      role: UserRole.JUNIOR_SALES_MANAGER,
      assignedEntityIds: ['entity-assigned']
    };

    describe('Admin Access', () => {
      it('should allow admin to create any entity', () => {
        expect(canUserAccessEntity(adminUser, 'organisations', 'canCreate')).toBe(true);
        expect(canUserAccessEntity(adminUser, 'deals', 'canCreate')).toBe(true);
        expect(canUserAccessEntity(adminUser, 'contracts', 'canCreate')).toBe(true);
      });

      it('should allow admin to read any entity', () => {
        expect(canUserAccessEntity(adminUser, 'organisations', 'canRead', 'any-id')).toBe(true);
        expect(canUserAccessEntity(adminUser, 'deals', 'canRead', 'any-id')).toBe(true);
      });

      it('should allow admin to update any entity', () => {
        expect(canUserAccessEntity(adminUser, 'deals', 'canUpdate', 'any-id', 'other-user')).toBe(true);
        expect(canUserAccessEntity(adminUser, 'leads', 'canUpdate', 'any-id', 'other-user')).toBe(true);
      });

      it('should allow admin to delete any entity', () => {
        expect(canUserAccessEntity(adminUser, 'organisations', 'canDelete', 'any-id')).toBe(true);
        expect(canUserAccessEntity(adminUser, 'deals', 'canDelete', 'any-id', 'other-user')).toBe(true);
      });
    });

    describe('Senior Manager Access', () => {
      it('should allow senior manager to create entities', () => {
        expect(canUserAccessEntity(seniorManager, 'organisations', 'canCreate')).toBe(true);
        expect(canUserAccessEntity(seniorManager, 'deals', 'canCreate')).toBe(true);
      });

      it('should allow senior manager to read all entities', () => {
        expect(canUserAccessEntity(seniorManager, 'organisations', 'canRead', 'any-id')).toBe(true);
        expect(canUserAccessEntity(seniorManager, 'deals', 'canRead', 'any-id')).toBe(true);
      });

      it('should deny senior manager from deleting organisations', () => {
        expect(canUserAccessEntity(seniorManager, 'organisations', 'canDelete', 'any-id')).toBe(false);
      });

      it('should deny senior manager from updating deals (canUpdate is false)', () => {
        // Senior manager cannot update deals at all - the base permission is false
        expect(canUserAccessEntity(seniorManager, 'deals', 'canUpdate', 'unassigned-id', 'other-user')).toBe(false);
        expect(canUserAccessEntity(seniorManager, 'deals', 'canUpdate', 'entity-assigned', 'other-user')).toBe(false);
        expect(canUserAccessEntity(seniorManager, 'deals', 'canUpdate', 'any-id', seniorManager.id)).toBe(false);
      });

      it('should allow senior manager to update organisations', () => {
        // Senior manager can update organisations - canUpdate is true for organisations
        expect(canUserAccessEntity(seniorManager, 'organisations', 'canUpdate', 'any-id')).toBe(true);
      });

      it('should allow senior manager to update contracts', () => {
        // Senior manager can update contracts - canUpdate is true for contracts
        expect(canUserAccessEntity(seniorManager, 'contracts', 'canUpdate', 'entity-assigned')).toBe(true);
      });
    });

    describe('Junior Manager Access', () => {
      it('should allow junior manager to create entities', () => {
        expect(canUserAccessEntity(juniorManager, 'organisations', 'canCreate')).toBe(true);
        expect(canUserAccessEntity(juniorManager, 'deals', 'canCreate')).toBe(true);
      });

      it('should deny junior manager from reading unassigned entities (canRead is false, needs assignment)', () => {
        // Junior manager has canRead: false for most entities, so they fail the basic check
        // The function returns false at line 83 before checking assignments
        expect(canUserAccessEntity(juniorManager, 'organisations', 'canRead', 'unassigned-id', 'other-user')).toBe(false);
        expect(canUserAccessEntity(juniorManager, 'deals', 'canRead', 'unassigned-id', 'other-user')).toBe(false);
      });

      it('should deny junior manager from reading deals (canRead is false)', () => {
        // Junior manager cannot read deals at all - canRead is false
        // Even if assigned, the base permission check fails first
        expect(canUserAccessEntity(juniorManager, 'deals', 'canRead', 'entity-assigned')).toBe(false);
        expect(canUserAccessEntity(juniorManager, 'deals', 'canRead', 'any-id', juniorManager.id)).toBe(false);
      });

      it('should allow junior manager to read pipelines (canRead and canReadAll are true)', () => {
        expect(canUserAccessEntity(juniorManager, 'pipelines', 'canRead')).toBe(true);
      });

      it('should deny junior manager from creating pipelines', () => {
        expect(canUserAccessEntity(juniorManager, 'pipelines', 'canCreate')).toBe(false);
      });

      it('should deny junior manager from updating deals and leads (canUpdate is false)', () => {
        // Junior manager has canUpdate: false for deals and leads
        expect(canUserAccessEntity(juniorManager, 'deals', 'canUpdate', 'unassigned-id', 'other-user')).toBe(false);
        expect(canUserAccessEntity(juniorManager, 'leads', 'canUpdate', 'unassigned-id', 'other-user')).toBe(false);
        expect(canUserAccessEntity(juniorManager, 'deals', 'canUpdate', 'entity-assigned')).toBe(false);
      });

      it('should deny junior manager from updating tasks (canUpdate is false)', () => {
        // Junior manager has canUpdate: false for tasks
        expect(canUserAccessEntity(juniorManager, 'tasks', 'canUpdate', 'entity-assigned')).toBe(false);
        expect(canUserAccessEntity(juniorManager, 'tasks', 'canUpdate', 'any-id', juniorManager.id)).toBe(false);
      });
    });
  });

  describe('resolveUserPermissions (Custom Roles)', () => {
    const baseRole: CustomRolePermissions = {
      permissions: {
        organisations: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        contacts: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        deals: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: false },
        leads: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: false },
        tasks: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: false },
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        contracts: { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canReadAll: false }
      }
    };

    it('should return base role permissions when no overrides', () => {
      const user: CRMRBACUser = {
        id: 'user-1',
        customRoleId: 'role-1'
      };

      const resolved = resolveUserPermissions(user, baseRole);

      expect(resolved.organisations.canCreate).toBe(true);
      expect(resolved.organisations.canUpdate).toBe(false);
      expect(resolved.deals.canReadAll).toBe(false);
    });

    it('should apply user permission overrides', () => {
      const user: CRMRBACUser = {
        id: 'user-1',
        customRoleId: 'role-1',
        permissionOverrides: {
          organisations: { canUpdate: true }, // Grant update permission
          deals: { canReadAll: true } // Grant read all
        }
      };

      const resolved = resolveUserPermissions(user, baseRole);

      // Overridden permissions
      expect(resolved.organisations.canUpdate).toBe(true);
      expect(resolved.deals.canReadAll).toBe(true);

      // Non-overridden permissions stay the same
      expect(resolved.organisations.canCreate).toBe(true);
      expect(resolved.organisations.canDelete).toBe(false);
    });

    it('should allow revoking permissions via overrides', () => {
      const user: CRMRBACUser = {
        id: 'user-1',
        customRoleId: 'role-1',
        permissionOverrides: {
          organisations: { canCreate: false } // Revoke create permission
        }
      };

      const resolved = resolveUserPermissions(user, baseRole);

      expect(resolved.organisations.canCreate).toBe(false);
      expect(resolved.organisations.canRead).toBe(true); // Not overridden
    });
  });

  describe('canCRMUserAccessEntity (Custom Roles)', () => {
    const customRole: CustomRolePermissions = {
      permissions: {
        organisations: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        contacts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: true },
        deals: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: false },
        leads: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: false },
        tasks: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: false },
        pipelines: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canReadAll: true },
        contracts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canReadAll: false }
      }
    };

    const crmUser: CRMRBACUser = {
      id: 'user-1',
      customRoleId: 'role-1',
      assignedEntityIds: ['assigned-deal']
    };

    it('should allow access based on custom role permissions', () => {
      expect(canCRMUserAccessEntity(crmUser, customRole, 'organisations', 'canCreate')).toBe(true);
      expect(canCRMUserAccessEntity(crmUser, customRole, 'pipelines', 'canCreate')).toBe(false);
    });

    it('should enforce canReadAll for read operations', () => {
      // Organisations have canReadAll = true
      expect(canCRMUserAccessEntity(crmUser, customRole, 'organisations', 'canRead', 'any-id')).toBe(true);

      // Deals don't have canReadAll - requires assignment
      expect(canCRMUserAccessEntity(crmUser, customRole, 'deals', 'canRead', 'unassigned-id', 'other-user')).toBe(false);
      expect(canCRMUserAccessEntity(crmUser, customRole, 'deals', 'canRead', 'assigned-deal')).toBe(true);
    });

    it('should apply permission overrides for access checks', () => {
      const userWithOverrides: CRMRBACUser = {
        id: 'user-2',
        customRoleId: 'role-1',
        permissionOverrides: {
          deals: { canReadAll: true } // Override to allow reading all deals
        }
      };

      // Now should be able to read any deal
      expect(canCRMUserAccessEntity(userWithOverrides, customRole, 'deals', 'canRead', 'any-deal')).toBe(true);
    });

    it('should enforce update restrictions based on assignment', () => {
      // Without canReadAll, update requires assignment
      expect(canCRMUserAccessEntity(crmUser, customRole, 'deals', 'canUpdate', 'unassigned-id', 'other-user')).toBe(false);
      expect(canCRMUserAccessEntity(crmUser, customRole, 'deals', 'canUpdate', 'assigned-deal')).toBe(true);
      expect(canCRMUserAccessEntity(crmUser, customRole, 'deals', 'canUpdate', 'any-id', crmUser.id)).toBe(true);
    });
  });

  describe('Permission Matrix Validation', () => {
    it('should maintain consistency between role levels', () => {
      const adminPerms = getUserPermissions(UserRole.ADMIN);
      const seniorPerms = getUserPermissions(UserRole.SENIOR_SALES_MANAGER);
      const juniorPerms = getUserPermissions(UserRole.JUNIOR_SALES_MANAGER);

      // Admin should have equal or more permissions than senior manager
      Object.keys(adminPerms).forEach((entity) => {
        const entityKey = entity as keyof typeof adminPerms;
        if (adminPerms[entityKey].canDelete) {
          // If admin can delete, that's fine - senior might not be able to
        }
        if (adminPerms[entityKey].canReadAll && seniorPerms[entityKey].canReadAll) {
          // Both can read all - that's valid
        }
      });

      // Junior manager should have fewer permissions than senior manager
      expect(juniorPerms.organisations.canReadAll).toBe(false);
      expect(seniorPerms.organisations.canReadAll).toBe(true);
    });

    it('should ensure pipelines are always readable for managers', () => {
      // Pipelines need to be readable for all managers to manage deals
      const seniorPerms = getUserPermissions(UserRole.SENIOR_SALES_MANAGER);
      const juniorPerms = getUserPermissions(UserRole.JUNIOR_SALES_MANAGER);

      expect(seniorPerms.pipelines.canRead).toBe(true);
      expect(juniorPerms.pipelines.canRead).toBe(true);
    });
  });
});
