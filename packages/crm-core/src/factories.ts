import { nanoid } from 'nanoid';
import {
  Organisation,
  Contact,
  Lead,
  Deal,
  Pipeline,
  Stage,
  Task,
  CustomFieldDef,
  CustomFieldValue,
  Activity,
  DealStatus,
  TaskStatus,
  TaskPriority,
  OrganizationType,
  EntityType,
  ActivityType,
  CustomFieldType,
  DealCurrentStage,
  DealStageHistory
} from './types';

const DEFAULT_TENANT_ID = 'tenant_001';

export function makeOrganisation(partial?: Partial<Organisation>): Organisation {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    name: 'New Organisation',
    companyId: `COMP-${nanoid(6)}`,
    type: OrganizationType.DEALER,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeContact(partial?: Partial<Contact>): Contact {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    firstName: 'John',
    lastName: 'Doe',
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeLead(partial?: Partial<Lead>): Lead {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    title: 'New Lead',
    isTarget: false,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeDeal(partial?: Partial<Deal>): Deal {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    title: 'New Deal',
    status: DealStatus.OPEN,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makePipeline(partial?: Partial<Pipeline>): Pipeline {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    name: 'New Pipeline',
    order: 0,
    applicableTypes: [OrganizationType.DEALER],
    isTypeSpecific: true,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeStage(pipelineId: string, partial?: Partial<Stage>): Stage {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    pipelineId,
    name: 'New Stage',
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeTask(targetType: EntityType, targetId: string, partial?: Partial<Task>): Task {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    title: 'New Task',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    targetType,
    targetId,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeCustomFieldDef(entityType: EntityType, partial?: Partial<CustomFieldDef>): CustomFieldDef {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    entityType,
    name: 'New Field',
    fieldKey: 'new_field',
    type: CustomFieldType.TEXT,
    order: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeCustomFieldValue(fieldDefId: string, entityId: string, value: any, partial?: Partial<CustomFieldValue>): CustomFieldValue {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    fieldDefId,
    entityId,
    value,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeActivity(
  entityType: EntityType,
  entityId: string,
  type: ActivityType,
  description: string,
  partial?: Partial<Activity>
): Activity {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    entityType,
    entityId,
    type,
    description,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeDealCurrentStage(
  dealId: string,
  pipelineId: string,
  stageId: string,
  partial?: Partial<DealCurrentStage>
): DealCurrentStage {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    dealId,
    pipelineId,
    stageId,
    enteredAt: now,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeDealStageHistory(
  dealId: string,
  pipelineId: string,
  toStageId: string,
  partial?: Partial<DealStageHistory>
): DealStageHistory {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    dealId,
    pipelineId,
    toStageId,
    movedAt: now,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}