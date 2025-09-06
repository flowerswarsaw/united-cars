export interface Repository<T> {
  list(filter?: Partial<T>): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  search?(query: string): Promise<T[]>;
}

export interface LeadRepository<T> extends Repository<T> {
  convertToDeal(leadId: string, input: any): Promise<any>;
}

export interface DealRepository<T> extends Repository<T> {
  moveStage(dealId: string, input: { pipelineId: string; toStageId: string; note?: string; lossReason?: any }): Promise<T | undefined>;
  closeWon(dealId: string): Promise<T | undefined>;
  markLost(dealId: string, reason: any): Promise<T | undefined>;
  getByPipelineAndStage(pipelineId: string, stageId?: string): Promise<T[]>;
}

export interface PipelineRepository<T> extends Repository<T> {
  createStage(pipelineId: string, stage: any): Promise<any>;
  updateStage(stageId: string, data: any): Promise<any>;
  deleteStage(stageId: string): Promise<boolean>;
  reorderStages(pipelineId: string, stageIds: string[]): Promise<boolean>;
  getWithStages(id: string): Promise<T | undefined>;
}

export interface CustomFieldRepository {
  defineField(def: any): Promise<any>;
  updateFieldDef(id: string, data: any): Promise<any>;
  deactivateField(id: string): Promise<boolean>;
  getFieldDefs(entityType: any): Promise<any[]>;
  setValue(fieldDefId: string, entityId: string, value: any): Promise<any>;
  getValue(fieldDefId: string, entityId: string): Promise<any>;
  getValues(entityId: string): Promise<any[]>;
}

export interface TaskRepository<T> extends Repository<T> {
  getByTarget(targetType: any, targetId: string): Promise<T[]>;
  changeStatus(id: string, status: any): Promise<T | undefined>;
  changeAssignee(id: string, assigneeId: string | null): Promise<T | undefined>;
}

export interface ActivityRepository<T> {
  log(activity: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<T>;
  getByEntity(entityType: any, entityId: string): Promise<T[]>;
  list(filter?: Partial<T>): Promise<T[]>;
}