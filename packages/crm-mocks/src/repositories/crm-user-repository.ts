import {
  CRMUserProfile,
  CRMUserRepository as ICRMUserRepository,
  CRMUserWithRole,
  CRMUserSummary,
  UserHierarchyNode,
  CRMUserStats,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

export class CRMUserRepository extends BaseRepository<CRMUserProfile> implements ICRMUserRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.ORGANISATION); // Using ORGANISATION as closest match
  }

  // Basic user queries
  async getByPlatformUserId(platformUserId: string): Promise<CRMUserProfile | undefined> {
    const users = await this.list();
    return users.find(u => u.platformUserId === platformUserId);
  }

  async getByEmail(email: string): Promise<CRMUserProfile | undefined> {
    const users = await this.list();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async getWithRole(id: string): Promise<CRMUserWithRole | undefined> {
    const user = await this.get(id);
    if (!user) return undefined;

    // In a real implementation, this would fetch the role from CustomRoleRepository
    // For now, we return the user with a placeholder role
    return {
      ...user,
      role: undefined // Will be populated when CustomRoleRepository is wired up
    };
  }

  async listWithRoles(filter?: Partial<CRMUserProfile>): Promise<CRMUserWithRole[]> {
    const users = await this.list(filter);
    // In a real implementation, this would fetch roles for all users
    return users.map(user => ({
      ...user,
      role: undefined // Will be populated when CustomRoleRepository is wired up
    }));
  }

  async getSummaries(): Promise<CRMUserSummary[]> {
    const users = await this.list();
    return users.map(user => ({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      customRoleId: user.customRoleId,
      isActive: user.isActive
    }));
  }

  // Hierarchy methods
  async getSubordinates(userId: string, includeIndirect = false): Promise<CRMUserProfile[]> {
    const allUsers = await this.list();

    if (!includeIndirect) {
      // Direct reports only
      return allUsers.filter(u => u.managerId === userId);
    }

    // Recursive function to get all subordinates
    const getAllSubordinates = (managerId: string, collected: Set<string> = new Set()): CRMUserProfile[] => {
      const directReports = allUsers.filter(u => u.managerId === managerId && !collected.has(u.id));

      if (directReports.length === 0) return [];

      const results: CRMUserProfile[] = [];
      for (const report of directReports) {
        collected.add(report.id);
        results.push(report);
        results.push(...getAllSubordinates(report.id, collected));
      }

      return results;
    };

    return getAllSubordinates(userId);
  }

  async getManager(userId: string): Promise<CRMUserProfile | undefined> {
    const user = await this.get(userId);
    if (!user || !user.managerId) return undefined;
    return await this.get(user.managerId);
  }

  async setManager(userId: string, managerId: string | null): Promise<CRMUserProfile | undefined> {
    // Validate no circular hierarchy
    if (managerId) {
      const manager = await this.get(managerId);
      if (!manager) {
        throw new Error(`Manager with ID ${managerId} not found`);
      }

      // Check if setting this manager would create a cycle
      const isSubordinate = async (possibleSubId: string, managerId: string): Promise<boolean> => {
        const subordinates = await this.getSubordinates(possibleSubId, true);
        return subordinates.some(s => s.id === managerId);
      };

      if (await isSubordinate(userId, managerId)) {
        throw new Error('Cannot set manager - would create circular hierarchy');
      }
    }

    return await this.update(userId, { managerId: managerId || undefined });
  }

  async getHierarchy(rootUserId?: string): Promise<UserHierarchyNode[]> {
    const allUsers = await this.list();

    const buildNode = async (user: CRMUserProfile): Promise<UserHierarchyNode> => {
      const subordinates = await this.getSubordinates(user.id, false);
      const subordinateNodes = await Promise.all(subordinates.map(s => buildNode(s)));

      return {
        user,
        subordinates: subordinateNodes,
        level: 0 // Will be calculated during rendering
      };
    };

    if (rootUserId) {
      const rootUser = await this.get(rootUserId);
      if (!rootUser) return [];
      return [await buildNode(rootUser)];
    }

    // Get all top-level users (no manager)
    const topLevelUsers = allUsers.filter(u => !u.managerId && u.isActive);
    return await Promise.all(topLevelUsers.map(u => buildNode(u)));
  }

  // Team methods
  async getTeamMembers(teamId: string): Promise<CRMUserProfile[]> {
    const users = await this.list();
    return users.filter(u => u.teamIds.includes(teamId));
  }

  async addToTeam(userId: string, teamId: string): Promise<boolean> {
    const user = await this.get(userId);
    if (!user) return false;

    if (user.teamIds.includes(teamId)) {
      return true; // Already in team
    }

    const updated = await this.update(userId, {
      teamIds: [...user.teamIds, teamId]
    });

    return !!updated;
  }

  async removeFromTeam(userId: string, teamId: string): Promise<boolean> {
    const user = await this.get(userId);
    if (!user) return false;

    const updated = await this.update(userId, {
      teamIds: user.teamIds.filter(id => id !== teamId)
    });

    return !!updated;
  }

  // Permission methods
  async setPermissionOverrides(
    userId: string,
    overrides: CRMUserProfile['permissionOverrides']
  ): Promise<CRMUserProfile | undefined> {
    return await this.update(userId, { permissionOverrides: overrides });
  }

  async clearPermissionOverrides(userId: string): Promise<CRMUserProfile | undefined> {
    return await this.update(userId, { permissionOverrides: undefined });
  }

  // Role methods
  async assignRole(userId: string, roleId: string): Promise<CRMUserProfile | undefined> {
    return await this.update(userId, { customRoleId: roleId });
  }

  async getUsersByRole(roleId: string): Promise<CRMUserProfile[]> {
    const users = await this.list();
    return users.filter(u => u.customRoleId === roleId);
  }

  // Status management
  async activate(userId: string): Promise<CRMUserProfile | undefined> {
    return await this.update(userId, { status: 'ACTIVE' as any, isActive: true });
  }

  async deactivate(userId: string, deactivatedBy: string): Promise<{
    user: CRMUserProfile;
    dealsUnassigned: number;
    leadsUnassigned: number;
  }> {
    const user = await this.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    if (!user.isActive) {
      throw new Error(`User with ID ${userId} is already inactive`);
    }

    // Import repositories dynamically to avoid circular dependencies
    const { dealRepository } = await import('./deal-repository');
    const { leadRepository } = await import('./lead-repository');
    const { activityRepository } = await import('./activity-repository');

    const now = new Date();
    const unassignReason = 'user_deactivated';

    // 1. Unassign all deals
    const userDeals = await dealRepository.list({ responsibleUserId: userId });
    let dealsUnassigned = 0;

    for (const deal of userDeals) {
      await dealRepository.update(deal.id, {
        responsibleUserId: undefined,
        unassignedAt: now,
        unassignedReason: unassignReason
      });

      // Log activity
      await activityRepository.create({
        entityType: 'DEAL' as any,
        entityId: deal.id,
        type: 'DEAL_UNASSIGNED' as any,
        description: `Deal unassigned due to user deactivation: ${user.displayName}`,
        userId: deactivatedBy,
        meta: {
          previousUserId: userId,
          previousUserName: user.displayName,
          reason: unassignReason
        },
        tenantId: deal.tenantId
      });

      dealsUnassigned++;
    }

    // 2. Unassign all leads
    const userLeads = await leadRepository.list({ responsibleUserId: userId });
    let leadsUnassigned = 0;

    for (const lead of userLeads) {
      await leadRepository.update(lead.id, {
        responsibleUserId: undefined
      });

      // Log activity
      await activityRepository.create({
        entityType: 'LEAD' as any,
        entityId: lead.id,
        type: 'UPDATED' as any,
        description: `Lead unassigned due to user deactivation: ${user.displayName}`,
        userId: deactivatedBy,
        meta: {
          previousUserId: userId,
          previousUserName: user.displayName,
          reason: unassignReason,
          fieldChanged: 'responsibleUserId'
        },
        tenantId: lead.tenantId
      });

      leadsUnassigned++;
    }

    // 3. Deactivate the user
    const updatedUser = await this.update(userId, {
      status: 'INACTIVE' as any,
      isActive: false
    });

    if (!updatedUser) {
      throw new Error(`Failed to deactivate user ${userId}`);
    }

    // 4. Log user deactivation activity
    await activityRepository.create({
      entityType: 'ORGANISATION' as any, // Using ORGANISATION as closest match for user entity
      entityId: userId,
      type: 'USER_DEACTIVATED' as any,
      description: `User deactivated: ${user.displayName}`,
      userId: deactivatedBy,
      meta: {
        deactivatedUserId: userId,
        deactivatedUserName: user.displayName,
        dealsUnassigned,
        leadsUnassigned
      },
      tenantId: user.tenantId
    });

    return {
      user: updatedUser,
      dealsUnassigned,
      leadsUnassigned
    };
  }

  // Statistics (mock implementation - would calculate from actual data in production)
  async getStats(
    userId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<CRMUserStats> {
    // This is a mock implementation
    // In production, this would aggregate data from deals, contacts, leads, tasks repositories
    return {
      userId,
      dealsCreated: 0,
      dealsWon: 0,
      dealsLost: 0,
      dealsTotalValue: 0,
      dealsWonValue: 0,
      contactsManaged: 0,
      contactsCreated: 0,
      leadsCreated: 0,
      leadsConverted: 0,
      conversionRate: 0,
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksOverdue: 0,
      organisationsManaged: 0,
      calculatedAt: new Date(),
      periodStart,
      periodEnd
    };
  }

  async bulkGetStats(
    userIds: string[],
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<Map<string, CRMUserStats>> {
    const statsMap = new Map<string, CRMUserStats>();

    for (const userId of userIds) {
      const stats = await this.getStats(userId, periodStart, periodEnd);
      statsMap.set(userId, stats);
    }

    return statsMap;
  }

  // Pagination support
  async listPaginated(query: any): Promise<any> {
    const allUsers = await this.list(query.filter);
    const start = ((query.page || 1) - 1) * (query.limit || 20);
    const end = start + (query.limit || 20);

    return {
      items: allUsers.slice(start, end),
      total: allUsers.length,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(allUsers.length / (query.limit || 20))
    };
  }

  async searchPaginated(
    query: string,
    searchFields?: (keyof CRMUserProfile)[],
    pagination?: { page?: number; limit?: number }
  ): Promise<any> {
    const allUsers = await this.list();
    const lowerQuery = query.toLowerCase();

    const filteredUsers = allUsers.filter(user => {
      const fields = searchFields || ['displayName', 'email'];
      return fields.some(field => {
        const value = user[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
      });
    });

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filteredUsers.slice(start, end),
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit)
    };
  }

  async search(query: string, searchFields?: (keyof CRMUserProfile)[]): Promise<CRMUserProfile[]> {
    const result = await this.searchPaginated(query, searchFields, { page: 1, limit: 1000 });
    return result.items;
  }
}

// Export singleton instance
export const crmUserRepository = new CRMUserRepository();
