import {
  CustomRole,
  CustomRoleRepository as ICustomRoleRepository,
  CustomRoleWithStats,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

export class CustomRoleRepository extends BaseRepository<CustomRole> implements ICustomRoleRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.ORGANISATION); // Using ORGANISATION as closest match
  }

  // Role queries
  async getByName(name: string): Promise<CustomRole | undefined> {
    const roles = await this.list();
    return roles.find(r => r.name.toLowerCase() === name.toLowerCase());
  }

  async getActiveRoles(): Promise<CustomRole[]> {
    const roles = await this.list();
    return roles.filter(r => r.isActive);
  }

  async getSystemRoles(): Promise<CustomRole[]> {
    const roles = await this.list();
    return roles.filter(r => r.isSystem);
  }

  async getCustomRoles(): Promise<CustomRole[]> {
    const roles = await this.list();
    return roles.filter(r => !r.isSystem);
  }

  async getWithStats(id: string): Promise<CustomRoleWithStats | undefined> {
    const role = await this.get(id);
    if (!role) return undefined;

    const userCount = await this.getUserCount(id);

    return {
      ...role,
      userCount
    };
  }

  async listWithStats(): Promise<CustomRoleWithStats[]> {
    const roles = await this.list();

    const rolesWithStats = await Promise.all(
      roles.map(async role => ({
        ...role,
        userCount: await this.getUserCount(role.id)
      }))
    );

    return rolesWithStats;
  }

  // Role management
  async activate(roleId: string): Promise<CustomRole | undefined> {
    return await this.update(roleId, { isActive: true });
  }

  async deactivate(roleId: string): Promise<CustomRole | undefined> {
    // Check if role can be deactivated (has no users)
    const userCount = await this.getUserCount(roleId);
    if (userCount > 0) {
      throw new Error(`Cannot deactivate role - ${userCount} user(s) still assigned to this role`);
    }

    return await this.update(roleId, { isActive: false });
  }

  // Permission methods
  async updatePermissions(
    roleId: string,
    permissions: CustomRole['permissions']
  ): Promise<CustomRole | undefined> {
    const role = await this.get(roleId);
    if (!role) return undefined;

    // System roles cannot have permissions changed
    if (role.isSystem) {
      throw new Error('Cannot modify permissions of system roles');
    }

    return await this.update(roleId, { permissions });
  }

  // User count
  async getUserCount(roleId: string): Promise<number> {
    // Import repository at runtime to avoid circular dependency
    const { crmUserRepository } = require('./crm-user-repository');
    const users = await crmUserRepository.list();
    return users.filter((u: any) => u.customRoleId === roleId).length;
  }

  // System role protection
  async canDelete(roleId: string): Promise<boolean> {
    const role = await this.get(roleId);
    if (!role) return false;

    // Cannot delete system roles
    if (role.isSystem) return false;

    // Cannot delete roles with active users
    const userCount = await this.getUserCount(roleId);
    return userCount === 0;
  }

  // Override remove to add protection
  async remove(id: string): Promise<boolean> {
    const canDel = await this.canDelete(id);
    if (!canDel) {
      const role = await this.get(id);
      if (role?.isSystem) {
        throw new Error('Cannot delete system roles');
      }
      throw new Error('Cannot delete role - users are still assigned to this role');
    }

    return super.remove(id);
  }

  // Pagination support
  async listPaginated(query: any): Promise<any> {
    const allRoles = await this.list(query.filter);
    const start = ((query.page || 1) - 1) * (query.limit || 20);
    const end = start + (query.limit || 20);

    return {
      items: allRoles.slice(start, end),
      total: allRoles.length,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(allRoles.length / (query.limit || 20))
    };
  }

  async searchPaginated(
    query: string,
    searchFields?: (keyof CustomRole)[],
    pagination?: { page?: number; limit?: number }
  ): Promise<any> {
    const allRoles = await this.list();
    const lowerQuery = query.toLowerCase();

    const filteredRoles = allRoles.filter(role => {
      const fields = searchFields || ['name', 'description'];
      return fields.some(field => {
        const value = role[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
      });
    });

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filteredRoles.slice(start, end),
      total: filteredRoles.length,
      page,
      limit,
      totalPages: Math.ceil(filteredRoles.length / limit)
    };
  }

  async search(query: string, searchFields?: (keyof CustomRole)[]): Promise<CustomRole[]> {
    const result = await this.searchPaginated(query, searchFields, { page: 1, limit: 1000 });
    return result.items;
  }
}

// Export singleton instance
export const customRoleRepository = new CustomRoleRepository();
