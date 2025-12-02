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
  ChangeLog,
  FieldChange,
  DealStatus,
  TaskStatus,
  TaskPriority,
  OrganizationType,
  EntityType,
  ActivityType,
  CustomFieldType,
  DealCurrentStage,
  DealStageHistory,
  Contract,
  ContractStatus,
  ContractType,
  ContactMethod,
  ContactMethodType,
  ContactType
} from './types';

const DEFAULT_TENANT_ID = 'united-cars';

export function makeOrganisation(partial?: Partial<Organisation>): Organisation {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    name: 'New Organisation',
    companyId: `COMP-${nanoid(6)}`,
    type: OrganizationType.DEALER,
    contactMethods: [],
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}

export function makeContact(partial?: Partial<Contact>): Contact {
  const now = new Date();

  // Auto-generate contactMethods from email/phone if not explicitly provided
  let contactMethods: ContactMethod[] = partial?.contactMethods ?? [];

  if (contactMethods.length === 0) {
    // Auto-generate from email if provided
    if (partial?.email) {
      contactMethods.push({
        id: nanoid(),
        type: ContactMethodType.EMAIL,
        value: partial.email,
        isPrimary: contactMethods.length === 0
      });
    }

    // Auto-generate from phone if provided
    if (partial?.phone) {
      contactMethods.push({
        id: nanoid(),
        type: ContactMethodType.PHONE,
        value: partial.phone,
        isPrimary: contactMethods.length === 0
      });
    }
  }

  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    firstName: 'John',
    lastName: 'Doe',
    type: ContactType.SALES,
    contactMethods,
    createdAt: now,
    updatedAt: now,
    ...partial,
    // Ensure contactMethods from auto-generation takes precedence over empty array in partial
    contactMethods: partial?.contactMethods?.length ? partial.contactMethods : contactMethods
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

export function makeContract(partial?: Partial<Contract>): Contract {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    title: 'New Contract',
    contractNumber: `CNT-${nanoid(6).toUpperCase()}`,
    type: ContractType.SERVICE,
    status: ContractStatus.DRAFT,
    organisationId: '',
    contactIds: [],
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
  meta?: Record<string, any>,
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
    meta,
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

export function makeChangeLog(
  entityType: EntityType,
  entityId: string,
  action: ActivityType,
  summary: string,
  changes: FieldChange[],
  userId: string,
  partial?: Partial<ChangeLog>
): ChangeLog {
  const now = new Date();
  return {
    id: nanoid(),
    tenantId: DEFAULT_TENANT_ID,
    entityType,
    entityId,
    action,
    summary,
    changes,
    userId,
    createdAt: now,
    updatedAt: now,
    ...partial
  };
}