import {
  Lead, Deal, Pipeline, Stage, Task, CustomFieldDef, CustomFieldValue, Activity, ChangeLog,
  EntityType, DealStatus, LossReason, TaskStatus, TaskPriority, CustomFieldType,
  PaginatedResult, ListQuery
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