import {
  Lead, Deal, Pipeline, Stage, Task, CustomFieldDef, CustomFieldValue, Activity, ChangeLog,
  EntityType, DealStatus, LossReason, TaskStatus, TaskPriority, CustomFieldType,
  PaginatedResult, ListQuery,
  CRMUserProfile, CustomRole, Team, TeamMembership, UserActivity, CRMUserStats,
  UserHierarchyNode, CRMUserWithRole, CRMUserSummary, TeamWithMembers, CustomRoleWithStats,
  PipelineRule, RuleExecution, RuleExecutionSummary, RuleTrigger
} from './types';
import { ConvertLeadInput, MoveDealInput } from './schemas';

// Enhanced generic repository interface with better type constraints
export interface Repository<T extends { id: string; tenantId: string; createdAt: Date; updatedAt: Date; createdBy?: string; updatedBy?: string }> {
  // Legacy methods - kept for backward compatibility
  list(filter?: Partial<T>): Promise<T[]>;
  search?(query: string, searchFields?: (keyof T)[]): Promise<T[]>;
  
  // New paginated methods for scalable data loading
  listPaginated(query: ListQuery<T>): Promise<PaginatedResult<T>>;
  searchPaginated?(query: string, searchFields?: (keyof T)[], pagination?: { page?: number; limit?: number }): Promise<PaginatedResult<T>>;
  
  // Standard CRUD methods with user tracking
  get(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>, createdBy?: string): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>, updatedBy?: string): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
}

export interface LeadRepository extends Repository<Lead> {
  convertToDeal(leadId: string, input: ConvertLeadInput): Promise<Deal>;
}

export interface DealRepository extends Repository<Deal> {
  moveStage(dealId: string, input: MoveDealInput): Promise<Deal | undefined>;
  closeWon(dealId: string): Promise<Deal | undefined>;
  markLost(dealId: string, reason: LossReason): Promise<Deal | undefined>;
  getByPipelineAndStage(pipelineId: string, stageId?: string): Promise<Deal[]>;
}

export interface PipelineRepository extends Repository<Pipeline> {
  createStage(pipelineId: string, stage: Omit<Stage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'pipelineId'>): Promise<Stage>;
  updateStage(stageId: string, data: Partial<Omit<Stage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'pipelineId'>>): Promise<Stage | undefined>;
  deleteStage(stageId: string): Promise<boolean>;
  reorderStages(pipelineId: string, stageIds: string[]): Promise<boolean>;
  getWithStages(id: string): Promise<Pipeline | undefined>;
}

export interface CustomFieldRepository {
  defineField(def: Omit<CustomFieldDef, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<CustomFieldDef>;
  updateFieldDef(id: string, data: Partial<Omit<CustomFieldDef, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<CustomFieldDef | undefined>;
  deactivateField(id: string): Promise<boolean>;
  getFieldDefs(entityType: EntityType): Promise<CustomFieldDef[]>;
  setValue(fieldDefId: string, entityId: string, value: any): Promise<CustomFieldValue>;
  getValue(fieldDefId: string, entityId: string): Promise<CustomFieldValue | undefined>;
  getValues(entityId: string): Promise<CustomFieldValue[]>;
}

export interface TaskRepository extends Repository<Task> {
  getByTarget(targetType: EntityType, targetId: string): Promise<Task[]>;
  changeStatus(id: string, status: TaskStatus): Promise<Task | undefined>;
  changeAssignee(id: string, assigneeId: string | null): Promise<Task | undefined>;
}

export interface ActivityRepository {
  log(activity: Omit<Activity, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Activity>;
  getByEntity(entityType: EntityType, entityId: string): Promise<Activity[]>;
  list(filter?: Partial<Activity>): Promise<Activity[]>;
}

export interface ChangeLogRepository {
  logChange(changeLog: Omit<ChangeLog, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ChangeLog>;
  getChangesForEntity(entityType: EntityType, entityId: string, limit?: number): Promise<ChangeLog[]>;
  getChangesByUser(userId: string, limit?: number): Promise<ChangeLog[]>;
  getRecentChanges(limit?: number): Promise<ChangeLog[]>;
}

// ============================================================================
// USER MANAGEMENT REPOSITORIES
// ============================================================================

/**
 * CRM User Repository - Manages CRM user profiles with hierarchy and permissions
 */
export interface CRMUserRepository extends Repository<CRMUserProfile> {
  // Basic user queries
  getByPlatformUserId(platformUserId: string): Promise<CRMUserProfile | undefined>;
  getByEmail(email: string): Promise<CRMUserProfile | undefined>;
  getWithRole(id: string): Promise<CRMUserWithRole | undefined>;
  listWithRoles(filter?: Partial<CRMUserProfile>): Promise<CRMUserWithRole[]>;
  getSummaries(): Promise<CRMUserSummary[]>;

  // Hierarchy methods
  getSubordinates(userId: string, includeIndirect?: boolean): Promise<CRMUserProfile[]>;
  getManager(userId: string): Promise<CRMUserProfile | undefined>;
  setManager(userId: string, managerId: string | null): Promise<CRMUserProfile | undefined>;
  getHierarchy(rootUserId?: string): Promise<UserHierarchyNode[]>;

  // Team methods
  getTeamMembers(teamId: string): Promise<CRMUserProfile[]>;
  addToTeam(userId: string, teamId: string): Promise<boolean>;
  removeFromTeam(userId: string, teamId: string): Promise<boolean>;

  // Permission methods
  setPermissionOverrides(userId: string, overrides: CRMUserProfile['permissionOverrides']): Promise<CRMUserProfile | undefined>;
  clearPermissionOverrides(userId: string): Promise<CRMUserProfile | undefined>;

  // Role methods
  assignRole(userId: string, roleId: string): Promise<CRMUserProfile | undefined>;
  getUsersByRole(roleId: string): Promise<CRMUserProfile[]>;

  // Status management
  activate(userId: string): Promise<CRMUserProfile | undefined>;
  deactivate(userId: string): Promise<CRMUserProfile | undefined>;

  // Statistics
  getStats(userId: string, periodStart?: Date, periodEnd?: Date): Promise<CRMUserStats>;
  bulkGetStats(userIds: string[], periodStart?: Date, periodEnd?: Date): Promise<Map<string, CRMUserStats>>;
}

/**
 * Custom Role Repository - Manages custom roles and their permissions
 */
export interface CustomRoleRepository extends Repository<CustomRole> {
  // Role queries
  getByName(name: string): Promise<CustomRole | undefined>;
  getActiveRoles(): Promise<CustomRole[]>;
  getSystemRoles(): Promise<CustomRole[]>;
  getCustomRoles(): Promise<CustomRole[]>;
  getWithStats(id: string): Promise<CustomRoleWithStats | undefined>;
  listWithStats(): Promise<CustomRoleWithStats[]>;

  // Role management
  activate(roleId: string): Promise<CustomRole | undefined>;
  deactivate(roleId: string): Promise<CustomRole | undefined>;

  // Permission methods
  updatePermissions(roleId: string, permissions: CustomRole['permissions']): Promise<CustomRole | undefined>;

  // User count
  getUserCount(roleId: string): Promise<number>;

  // System role protection
  canDelete(roleId: string): Promise<boolean>;
}

/**
 * Team Repository - Manages teams and their memberships
 */
export interface TeamRepository extends Repository<Team> {
  // Team queries
  getByName(name: string): Promise<Team | undefined>;
  getActiveTeams(): Promise<Team[]>;
  getWithMembers(id: string): Promise<TeamWithMembers | undefined>;
  listWithMembers(): Promise<TeamWithMembers[]>;

  // Member management
  addMember(teamId: string, userId: string, role: TeamMembership['role']): Promise<TeamMembership>;
  removeMember(teamId: string, userId: string): Promise<boolean>;
  updateMemberRole(teamId: string, userId: string, role: TeamMembership['role']): Promise<TeamMembership | undefined>;
  getMembers(teamId: string): Promise<TeamMembership[]>;
  getMemberCount(teamId: string): Promise<number>;

  // Leader management
  setLeader(teamId: string, userId: string): Promise<Team | undefined>;
  removeLeader(teamId: string): Promise<Team | undefined>;

  // User teams
  getUserTeams(userId: string): Promise<Team[]>;
  getUserMemberships(userId: string): Promise<TeamMembership[]>;

  // Team status
  activate(teamId: string): Promise<Team | undefined>;
  deactivate(teamId: string): Promise<Team | undefined>;
}

/**
 * User Activity Repository - Manages user activity logs and audit trails
 */
export interface UserActivityRepository {
  // Activity logging
  logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<UserActivity>;

  // Activity queries
  getUserActivities(userId: string, limit?: number, offset?: number): Promise<UserActivity[]>;
  getEntityActivities(entityType: EntityType, entityId: string, limit?: number): Promise<UserActivity[]>;
  getRecentActivities(limit?: number): Promise<UserActivity[]>;

  // Filtered queries
  getActivitiesByAction(userId: string, action: UserActivity['action'], limit?: number): Promise<UserActivity[]>;
  getActivitiesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<UserActivity[]>;

  // Statistics
  getActivityCount(userId: string, startDate?: Date, endDate?: Date): Promise<number>;
  getActivityBreakdown(userId: string, startDate?: Date, endDate?: Date): Promise<Record<string, number>>;
}

// ============================================================================
// PIPELINE RULES ENGINE REPOSITORIES
// ============================================================================

/**
 * Pipeline Rule Repository - Manages pipeline automation rules
 */
export interface PipelineRuleRepository extends Repository<PipelineRule> {
  // Rule queries
  getByPipeline(pipelineId: string): Promise<PipelineRule[]>;
  getGlobalRules(): Promise<PipelineRule[]>;
  getActiveRules(pipelineId?: string): Promise<PipelineRule[]>;
  getSystemRules(): Promise<PipelineRule[]>;
  getMigratedRules(): Promise<PipelineRule[]>;
  getByTrigger(trigger: RuleTrigger, pipelineId?: string): Promise<PipelineRule[]>;

  // Rule management
  activate(ruleId: string): Promise<PipelineRule | undefined>;
  deactivate(ruleId: string): Promise<PipelineRule | undefined>;
  reorderRules(ruleIds: string[]): Promise<boolean>;

  // System rule protection
  canDelete(ruleId: string): Promise<boolean>;

  // Rule execution tracking
  recordExecution(execution: Omit<RuleExecution, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<RuleExecution>;
  getExecutions(ruleId: string, limit?: number): Promise<RuleExecution[]>;
  getExecutionsByDeal(dealId: string, limit?: number): Promise<RuleExecution[]>;
  getExecutionSummary(ruleId: string, periodStart: Date, periodEnd: Date): Promise<RuleExecutionSummary>;

  // Cooldown management
  canExecute(ruleId: string, dealId: string): Promise<boolean>;
  markExecuted(ruleId: string, dealId: string): Promise<void>;
}