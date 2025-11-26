import {
  Team,
  TeamRepository as ITeamRepository,
  TeamMembership,
  TeamWithMembers,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { nanoid } from 'nanoid';

export class TeamRepository extends BaseRepository<Team> implements ITeamRepository {
  // Store team memberships separately
  private memberships: Map<string, TeamMembership> = new Map();

  constructor() {
    super();
    this.setEntityType(EntityType.ORGANISATION); // Using ORGANISATION as closest match
  }

  // Team queries
  async getByName(name: string): Promise<Team | undefined> {
    const teams = await this.list();
    return teams.find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  async getActiveTeams(): Promise<Team[]> {
    const teams = await this.list();
    return teams.filter(t => t.isActive);
  }

  async getWithMembers(id: string): Promise<TeamWithMembers | undefined> {
    const team = await this.get(id);
    if (!team) return undefined;

    const memberships = await this.getMembers(id);

    return {
      ...team,
      memberships
    };
  }

  async listWithMembers(): Promise<TeamWithMembers[]> {
    const teams = await this.list();

    const teamsWithMembers = await Promise.all(
      teams.map(async team => {
        const memberships = await this.getMembers(team.id);
        return {
          ...team,
          memberships
        };
      })
    );

    return teamsWithMembers;
  }

  // Member management
  async addMember(
    teamId: string,
    userId: string,
    role: TeamMembership['role']
  ): Promise<TeamMembership> {
    const team = await this.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Check if user is already a member
    const existingMemberships = Array.from(this.memberships.values());
    const existing = existingMemberships.find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (existing) {
      // Update role if different
      if (existing.role !== role) {
        existing.role = role;
        this.memberships.set(existing.id, existing);
      }
      return existing;
    }

    // Create new membership
    const membership: TeamMembership = {
      id: nanoid(),
      teamId,
      userId,
      role,
      joinedAt: new Date(),
      tenantId: this.tenantId
    };

    this.memberships.set(membership.id, membership);

    // If adding as leader, update team leader
    if (role === 'LEADER') {
      await this.update(teamId, { leaderId: userId });
    }

    return membership;
  }

  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const memberships = Array.from(this.memberships.values());
    const membership = memberships.find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (!membership) {
      return false;
    }

    this.memberships.delete(membership.id);

    // If removing leader, clear team leader
    const team = await this.get(teamId);
    if (team && team.leaderId === userId) {
      await this.update(teamId, { leaderId: undefined });
    }

    return true;
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamMembership['role']
  ): Promise<TeamMembership | undefined> {
    const memberships = Array.from(this.memberships.values());
    const membership = memberships.find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (!membership) {
      return undefined;
    }

    membership.role = role;
    this.memberships.set(membership.id, membership);

    // Update team leader if promoting to LEADER
    if (role === 'LEADER') {
      await this.update(teamId, { leaderId: userId });
    }

    return membership;
  }

  async getMembers(teamId: string): Promise<TeamMembership[]> {
    const memberships = Array.from(this.memberships.values());
    const teamMemberships = memberships.filter(m => m.teamId === teamId);

    // Populate user data for each membership
    const { crmUserRepository } = require('./crm-user-repository');
    const membershipsWithUsers = await Promise.all(
      teamMemberships.map(async (membership) => {
        const user = await crmUserRepository.get(membership.userId);
        return {
          ...membership,
          user: user ? {
            id: user.id,
            displayName: user.displayName,
            email: user.email
          } : undefined
        };
      })
    );

    return membershipsWithUsers;
  }

  async getMemberCount(teamId: string): Promise<number> {
    const members = await this.getMembers(teamId);
    return members.length;
  }

  // Leader management
  async setLeader(teamId: string, userId: string): Promise<Team | undefined> {
    const team = await this.get(teamId);
    if (!team) return undefined;

    // Ensure user is a member, promote to LEADER
    const memberships = await this.getMembers(teamId);
    const membership = memberships.find(m => m.userId === userId);

    if (!membership) {
      // Add user as leader
      await this.addMember(teamId, userId, 'LEADER');
    } else if (membership.role !== 'LEADER') {
      // Promote to leader
      await this.updateMemberRole(teamId, userId, 'LEADER');
    }

    // Demote previous leader if exists
    if (team.leaderId && team.leaderId !== userId) {
      await this.updateMemberRole(teamId, team.leaderId, 'MEMBER');
    }

    return await this.update(teamId, { leaderId: userId });
  }

  async removeLeader(teamId: string): Promise<Team | undefined> {
    const team = await this.get(teamId);
    if (!team || !team.leaderId) return team;

    // Demote current leader to member
    await this.updateMemberRole(teamId, team.leaderId, 'MEMBER');

    return await this.update(teamId, { leaderId: undefined });
  }

  // User teams
  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = Array.from(this.memberships.values());
    const userMemberships = memberships.filter(m => m.userId === userId);
    const teamIds = userMemberships.map(m => m.teamId);

    const teams = await this.list();
    return teams.filter(t => teamIds.includes(t.id));
  }

  async getUserMemberships(userId: string): Promise<TeamMembership[]> {
    const memberships = Array.from(this.memberships.values());
    return memberships.filter(m => m.userId === userId);
  }

  // Team status
  async activate(teamId: string): Promise<Team | undefined> {
    return await this.update(teamId, { isActive: true });
  }

  async deactivate(teamId: string): Promise<Team | undefined> {
    return await this.update(teamId, { isActive: false });
  }

  // Initialize memberships from seed data
  initializeMemberships(memberships: TeamMembership[]): void {
    for (const membership of memberships) {
      this.memberships.set(membership.id, membership);
    }
  }

  // Pagination support
  async listPaginated(query: any): Promise<any> {
    const allTeams = await this.list(query.filter);
    const start = ((query.page || 1) - 1) * (query.limit || 20);
    const end = start + (query.limit || 20);

    return {
      items: allTeams.slice(start, end),
      total: allTeams.length,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(allTeams.length / (query.limit || 20))
    };
  }

  async searchPaginated(
    query: string,
    searchFields?: (keyof Team)[],
    pagination?: { page?: number; limit?: number }
  ): Promise<any> {
    const allTeams = await this.list();
    const lowerQuery = query.toLowerCase();

    const filteredTeams = allTeams.filter(team => {
      const fields = searchFields || ['name', 'description'];
      return fields.some(field => {
        const value = team[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
      });
    });

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filteredTeams.slice(start, end),
      total: filteredTeams.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTeams.length / limit)
    };
  }

  async search(query: string, searchFields?: (keyof Team)[]): Promise<Team[]> {
    const result = await this.searchPaginated(query, searchFields, { page: 1, limit: 1000 });
    return result.items;
  }
}

// Export singleton instance
export const teamRepository = new TeamRepository();
