/**
 * Draft types and conversion functions for the Automation Workflow Builder
 */

import {
  type AutomationWorkflow,
  type AutomationTrigger,
  type AutomationConditionGroup,
  type AutomationCondition,
  type AutomationAction,
  type ActionTarget,
  type ActionConfig,
  TriggerType,
  EventType,
  EntityType,
  ActionType,
  ConditionOperator,
  LogicalOperator,
  TargetType,
} from '@united-cars/crm-automation';

// ============================================================================
// Draft Types - Intermediate state for the form
// ============================================================================

export interface DraftTrigger {
  type: TriggerType;
  eventType: EventType | string;
  entityType?: EntityType;
}

export interface DraftAction {
  id: string;
  type: ActionType;
  order: number;
  target: ActionTarget;
  config: Partial<ActionConfig>;
}

export interface DraftWorkflow {
  name: string;
  description: string;
  trigger: DraftTrigger;
  conditionGroups: AutomationConditionGroup[];
  actions: DraftAction[];
}

// ============================================================================
// ID Generators
// ============================================================================

export function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateConditionId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateConditionGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert an existing AutomationWorkflow to DraftWorkflow for editing
 */
export function workflowToDraft(workflow: AutomationWorkflow): DraftWorkflow {
  return {
    name: workflow.name,
    description: workflow.description || '',
    trigger: {
      type: workflow.trigger.type,
      eventType: workflow.trigger.config?.eventType || EventType.DEAL_CREATED,
      entityType: workflow.trigger.config?.entityType,
    },
    conditionGroups: workflow.conditionGroups || [],
    actions: workflow.actions.map((action) => ({
      id: action.id,
      type: action.type,
      order: action.order,
      target: action.target,
      config: action.config,
    })),
  };
}

/**
 * Convert DraftWorkflow to API payload for saving
 */
export function draftToPayload(draft: DraftWorkflow): {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditionGroups: AutomationConditionGroup[];
  actions: AutomationAction[];
  isActive?: boolean;
} {
  return {
    name: draft.name,
    description: draft.description,
    trigger: {
      type: draft.trigger.type,
      config: {
        eventType: draft.trigger.eventType,
        entityType: draft.trigger.entityType,
      },
    },
    conditionGroups: draft.conditionGroups,
    actions: draft.actions.map((action, index) => ({
      id: action.id,
      type: action.type,
      order: index + 1,
      target: action.target,
      config: action.config as ActionConfig,
    })),
  };
}

/**
 * Create a default empty DraftWorkflow
 */
export function createDefaultDraft(): DraftWorkflow {
  return {
    name: '',
    description: '',
    trigger: {
      type: TriggerType.EVENT,
      eventType: EventType.DEAL_WON,
      entityType: EntityType.DEAL,
    },
    conditionGroups: [],
    actions: [],
  };
}

/**
 * Create a default empty condition group
 */
export function createDefaultConditionGroup(): AutomationConditionGroup {
  return {
    id: generateConditionGroupId(),
    conditions: [],
    logicalOperator: LogicalOperator.AND,
  };
}

/**
 * Create a default empty condition
 */
export function createDefaultCondition(): AutomationCondition {
  return {
    id: generateConditionId(),
    field: '',
    operator: ConditionOperator.EQUALS,
    value: '',
    valueType: 'string',
  };
}

/**
 * Create a default action based on type
 */
export function createDefaultAction(type: ActionType): DraftAction {
  const id = generateActionId();
  const baseAction: DraftAction = {
    id,
    type,
    order: 1,
    target: { type: TargetType.NEW_ENTITY },
    config: { type: type as any },
  };

  switch (type) {
    case ActionType.CREATE_TASK:
      return {
        ...baseAction,
        config: {
          type: 'CREATE_TASK',
          titleTemplate: '',
          descriptionTemplate: '',
          priority: 'MEDIUM',
          dueInDays: 7,
          assigneeType: 'OWNER_OF_ENTITY',
          primaryContext: {
            entityType: EntityType.DEAL,
            entityId: 'FROM_EVENT',
          },
        },
      };
    case ActionType.CREATE_DEAL:
      return {
        ...baseAction,
        config: {
          type: 'CREATE_DEAL',
          pipelineId: '',
          stageId: '',
        },
      };
    case ActionType.UPDATE_RECORD:
      return {
        ...baseAction,
        target: { type: TargetType.PRIMARY_RECORD },
        config: {
          type: 'UPDATE_RECORD',
          entityType: EntityType.DEAL,
          fields: {},
        },
      };
    case ActionType.CALL_WEBHOOK:
      return {
        ...baseAction,
        target: { type: TargetType.PRIMARY_RECORD },
        config: {
          type: 'CALL_WEBHOOK',
          url: '',
          method: 'POST',
          headers: {},
          body: {},
          retries: 3,
          retryDelayMs: 1000,
          timeoutMs: 5000,
        },
      };
    case ActionType.CREATE_TICKET:
      return {
        ...baseAction,
        config: {
          type: 'CREATE_TICKET',
          titleTemplate: '',
          descriptionTemplate: '',
          ticketType: 'SUPPORT',
          priority: 'MEDIUM',
        },
      };
    default:
      return baseAction;
  }
}

// ============================================================================
// Event Type Mappings
// ============================================================================

export const ENTITY_EVENTS: Partial<Record<EntityType, EventType[]>> = {
  [EntityType.DEAL]: [
    EventType.DEAL_CREATED,
    EventType.DEAL_UPDATED,
    EventType.DEAL_STAGE_CHANGED,
    EventType.DEAL_STATUS_CHANGED,
    EventType.DEAL_WON,
    EventType.DEAL_LOST,
  ],
  [EntityType.TICKET]: [
    EventType.TICKET_CREATED,
    EventType.TICKET_UPDATED,
    EventType.TICKET_ASSIGNED,
    EventType.TICKET_STATUS_CHANGED,
  ],
  [EntityType.ORGANISATION]: [
    EventType.ORGANISATION_CREATED,
    EventType.ORGANISATION_UPDATED,
  ],
  [EntityType.CONTACT]: [
    EventType.CONTACT_CREATED,
    EventType.CONTACT_UPDATED,
  ],
  [EntityType.LEAD]: [
    EventType.LEAD_CREATED,
    EventType.LEAD_UPDATED,
    EventType.LEAD_CONVERTED,
  ],
  [EntityType.TASK]: [
    EventType.TASK_CREATED,
    EventType.TASK_COMPLETED,
    EventType.TASK_OVERDUE,
  ],
};

// ============================================================================
// Display Labels
// ============================================================================

export const EVENT_TYPE_LABELS: Record<string, string> = {
  [EventType.DEAL_CREATED]: 'Deal Created',
  [EventType.DEAL_UPDATED]: 'Deal Updated',
  [EventType.DEAL_STAGE_CHANGED]: 'Deal Stage Changed',
  [EventType.DEAL_STATUS_CHANGED]: 'Deal Status Changed',
  [EventType.DEAL_WON]: 'Deal Won',
  [EventType.DEAL_LOST]: 'Deal Lost',
  [EventType.TICKET_CREATED]: 'Ticket Created',
  [EventType.TICKET_UPDATED]: 'Ticket Updated',
  [EventType.TICKET_ASSIGNED]: 'Ticket Assigned',
  [EventType.TICKET_STATUS_CHANGED]: 'Ticket Status Changed',
  [EventType.ORGANISATION_CREATED]: 'Organisation Created',
  [EventType.ORGANISATION_UPDATED]: 'Organisation Updated',
  [EventType.CONTACT_CREATED]: 'Contact Created',
  [EventType.CONTACT_UPDATED]: 'Contact Updated',
  [EventType.LEAD_CREATED]: 'Lead Created',
  [EventType.LEAD_UPDATED]: 'Lead Updated',
  [EventType.LEAD_CONVERTED]: 'Lead Converted',
  [EventType.TASK_CREATED]: 'Task Created',
  [EventType.TASK_COMPLETED]: 'Task Completed',
  [EventType.TASK_OVERDUE]: 'Task Overdue',
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  [EntityType.DEAL]: 'Deal',
  [EntityType.TICKET]: 'Ticket',
  [EntityType.ORGANISATION]: 'Organisation',
  [EntityType.CONTACT]: 'Contact',
  [EntityType.LEAD]: 'Lead',
  [EntityType.TASK]: 'Task',
  [EntityType.CONTRACT]: 'Contract',
  [EntityType.PIPELINE]: 'Pipeline',
  [EntityType.STAGE]: 'Stage',
};

export const ACTION_TYPE_LABELS: Record<string, string> = {
  [ActionType.CREATE_TASK]: 'Create Task',
  [ActionType.CREATE_DEAL]: 'Create Deal',
  [ActionType.UPDATE_RECORD]: 'Update Record',
  [ActionType.CALL_WEBHOOK]: 'Call Webhook',
  [ActionType.CREATE_TICKET]: 'Create Ticket',
};

export const CONDITION_OPERATOR_LABELS: Record<string, string> = {
  [ConditionOperator.EQUALS]: 'equals',
  [ConditionOperator.NOT_EQUALS]: 'not equals',
  [ConditionOperator.GREATER_THAN]: 'greater than',
  [ConditionOperator.LESS_THAN]: 'less than',
  [ConditionOperator.GREATER_OR_EQUAL]: 'greater or equal',
  [ConditionOperator.LESS_OR_EQUAL]: 'less or equal',
  [ConditionOperator.IN]: 'in',
  [ConditionOperator.NOT_IN]: 'not in',
  [ConditionOperator.CONTAINS]: 'contains',
  [ConditionOperator.NOT_CONTAINS]: 'not contains',
  [ConditionOperator.IS_EMPTY]: 'is empty',
  [ConditionOperator.IS_NOT_EMPTY]: 'is not empty',
};

// ============================================================================
// Field Metadata System - Type-aware field definitions
// ============================================================================

export type FieldValueKind = 'string' | 'number' | 'boolean' | 'enum' | 'entityId';

export type FieldControlKind = 'text' | 'number' | 'select' | 'multi-select' | 'checkbox';

export interface FieldOption {
  value: string;
  label: string;
}

export type FieldOptionSource =
  | { type: 'static'; options: FieldOption[] }
  | { type: 'enum'; enumName: string }
  | { type: 'api'; resource: 'pipelines' | 'stages' | 'users' }
  | { type: 'none' };

export interface FieldMetadata {
  path: string;
  label: string;
  valueKind: FieldValueKind;
  control: FieldControlKind;
  optionSource: FieldOptionSource;
  allowedOperators: ConditionOperator[];
}

// Default operators for different value kinds
const STRING_OPERATORS = [
  ConditionOperator.EQUALS,
  ConditionOperator.NOT_EQUALS,
  ConditionOperator.CONTAINS,
  ConditionOperator.NOT_CONTAINS,
  ConditionOperator.IS_EMPTY,
  ConditionOperator.IS_NOT_EMPTY,
];

const NUMBER_OPERATORS = [
  ConditionOperator.EQUALS,
  ConditionOperator.NOT_EQUALS,
  ConditionOperator.GREATER_THAN,
  ConditionOperator.LESS_THAN,
  ConditionOperator.GREATER_OR_EQUAL,
  ConditionOperator.LESS_OR_EQUAL,
];

const ENUM_OPERATORS = [
  ConditionOperator.EQUALS,
  ConditionOperator.NOT_EQUALS,
  ConditionOperator.IN,
  ConditionOperator.NOT_IN,
];

const ENTITY_ID_OPERATORS = [
  ConditionOperator.EQUALS,
  ConditionOperator.NOT_EQUALS,
  ConditionOperator.IN,
  ConditionOperator.NOT_IN,
  ConditionOperator.IS_EMPTY,
  ConditionOperator.IS_NOT_EMPTY,
];

export const FIELD_METADATA: FieldMetadata[] = [
  // ============ Deal fields ============
  {
    path: 'deal.amount',
    label: 'Deal Amount',
    valueKind: 'number',
    control: 'number',
    optionSource: { type: 'none' },
    allowedOperators: NUMBER_OPERATORS,
  },
  {
    path: 'deal.pipelineId',
    label: 'Deal Pipeline',
    valueKind: 'entityId',
    control: 'select',
    optionSource: { type: 'api', resource: 'pipelines' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
  {
    path: 'deal.stageId',
    label: 'Deal Stage',
    valueKind: 'entityId',
    control: 'select',
    optionSource: { type: 'api', resource: 'stages' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
  {
    path: 'deal.status',
    label: 'Deal Status',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'DealStatus' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'deal.title',
    label: 'Deal Title',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'deal.currency',
    label: 'Deal Currency',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'deal.organisationId',
    label: 'Deal Organisation',
    valueKind: 'entityId',
    control: 'text', // Too many to select, use text
    optionSource: { type: 'none' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
  {
    path: 'deal.contactId',
    label: 'Deal Contact',
    valueKind: 'entityId',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
  {
    path: 'deal.ownerId',
    label: 'Deal Owner',
    valueKind: 'entityId',
    control: 'select',
    optionSource: { type: 'api', resource: 'users' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
  {
    path: 'deal.lossReason',
    label: 'Loss Reason',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'LossReason' },
    allowedOperators: ENUM_OPERATORS,
  },

  // ============ Ticket fields ============
  {
    path: 'ticket.priority',
    label: 'Ticket Priority',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'TicketPriority' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'ticket.status',
    label: 'Ticket Status',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'TicketStatus' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'ticket.type',
    label: 'Ticket Type',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'TicketType' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'ticket.title',
    label: 'Ticket Title',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'ticket.assigneeId',
    label: 'Ticket Assignee',
    valueKind: 'entityId',
    control: 'select',
    optionSource: { type: 'api', resource: 'users' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },

  // ============ Organisation fields ============
  {
    path: 'organisation.name',
    label: 'Organisation Name',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'organisation.type',
    label: 'Organisation Type',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'OrganisationType' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'organisation.country',
    label: 'Organisation Country',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'organisation.status',
    label: 'Organisation Status',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },

  // ============ Contact fields ============
  {
    path: 'contact.firstName',
    label: 'Contact First Name',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'contact.lastName',
    label: 'Contact Last Name',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'contact.organisationId',
    label: 'Contact Organisation',
    valueKind: 'entityId',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },

  // ============ Lead fields ============
  {
    path: 'lead.status',
    label: 'Lead Status',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'LeadStatus' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'lead.source',
    label: 'Lead Source',
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: STRING_OPERATORS,
  },
  {
    path: 'lead.type',
    label: 'Lead Type',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'LeadType' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'lead.value',
    label: 'Lead Value',
    valueKind: 'number',
    control: 'number',
    optionSource: { type: 'none' },
    allowedOperators: NUMBER_OPERATORS,
  },

  // ============ Task fields ============
  {
    path: 'task.status',
    label: 'Task Status',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'TaskStatus' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'task.priority',
    label: 'Task Priority',
    valueKind: 'enum',
    control: 'select',
    optionSource: { type: 'enum', enumName: 'TaskPriority' },
    allowedOperators: ENUM_OPERATORS,
  },
  {
    path: 'task.assigneeId',
    label: 'Task Assignee',
    valueKind: 'entityId',
    control: 'select',
    optionSource: { type: 'api', resource: 'users' },
    allowedOperators: ENTITY_ID_OPERATORS,
  },
];

// ============================================================================
// Enum Options - Labels for enum values
// ============================================================================

export const ENUM_OPTIONS: Record<string, FieldOption[]> = {
  DealStatus: [
    { value: 'OPEN', label: 'Open' },
    { value: 'WON', label: 'Won' },
    { value: 'LOST', label: 'Lost' },
    { value: 'INTEGRATION', label: 'Integration' },
    { value: 'CLOSED', label: 'Closed' },
  ],
  TicketPriority: [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ],
  TicketStatus: [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ],
  TicketType: [
    { value: 'SUPPORT', label: 'Support' },
    { value: 'INQUIRY', label: 'Inquiry' },
    { value: 'COMPLAINT', label: 'Complaint' },
    { value: 'FEEDBACK', label: 'Feedback' },
  ],
  TaskPriority: [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ],
  TaskStatus: [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ],
  LossReason: [
    { value: 'STOPPED_WORKING', label: 'Stopped Working' },
    { value: 'COULD_NOT_REACH_DM', label: 'Could Not Reach DM' },
    { value: 'REJECTION', label: 'Rejection' },
    { value: 'OTHER', label: 'Other' },
  ],
  OrganisationType: [
    { value: 'DEALER', label: 'Dealer' },
    { value: 'AUCTION', label: 'Auction' },
    { value: 'SHIPPER', label: 'Shipper' },
    { value: 'PROCESSING_CENTER', label: 'Processing Center' },
    { value: 'INTEGRATION_PARTNER', label: 'Integration Partner' },
    { value: 'OTHER', label: 'Other' },
  ],
  LeadStatus: [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'LOST', label: 'Lost' },
  ],
  LeadType: [
    { value: 'TARGET', label: 'Target' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'INBOUND', label: 'Inbound' },
  ],
};

// ============================================================================
// Field Metadata Helpers
// ============================================================================

/**
 * Get metadata for a specific field path
 */
export function getFieldMetadata(path: string | undefined): FieldMetadata | undefined {
  if (!path) return undefined;
  return FIELD_METADATA.find((f) => f.path === path);
}

/**
 * Get all fields for a specific entity type
 */
export function getFieldsForEntity(entityType: EntityType | undefined): FieldMetadata[] {
  if (!entityType) return [];
  const prefix = entityType.toLowerCase() + '.';
  return FIELD_METADATA.filter((f) => f.path.startsWith(prefix));
}

/**
 * Get default field metadata for unknown fields
 */
export function getDefaultFieldMetadata(path: string): FieldMetadata {
  return {
    path,
    label: path,
    valueKind: 'string',
    control: 'text',
    optionSource: { type: 'none' },
    allowedOperators: Object.values(ConditionOperator),
  };
}

// ============================================================================
// Common Field Suggestions (legacy - kept for backwards compatibility)
// ============================================================================

export const COMMON_FIELDS: Partial<Record<EntityType, string[]>> = {
  [EntityType.DEAL]: FIELD_METADATA.filter((f) => f.path.startsWith('deal.')).map((f) => f.path),
  [EntityType.TICKET]: FIELD_METADATA.filter((f) => f.path.startsWith('ticket.')).map((f) => f.path),
  [EntityType.ORGANISATION]: FIELD_METADATA.filter((f) => f.path.startsWith('organisation.')).map((f) => f.path),
  [EntityType.CONTACT]: FIELD_METADATA.filter((f) => f.path.startsWith('contact.')).map((f) => f.path),
  [EntityType.LEAD]: FIELD_METADATA.filter((f) => f.path.startsWith('lead.')).map((f) => f.path),
  [EntityType.TASK]: FIELD_METADATA.filter((f) => f.path.startsWith('task.')).map((f) => f.path),
};

// Re-export enums for convenience
export {
  TriggerType,
  EventType,
  EntityType,
  ActionType,
  ConditionOperator,
  LogicalOperator,
  TargetType,
};
