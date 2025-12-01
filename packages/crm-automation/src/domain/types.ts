/**
 * Automation/Workflow Module - Core Types
 *
 * Mental model: Trigger → Conditions → Actions → Logs
 *
 * This is the UNIVERSAL automation system for the entire CRM.
 * All automatic behavior should flow through this engine.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Entity types that can be targeted by automations
 */
export enum EntityType {
  DEAL = 'DEAL',
  TICKET = 'TICKET',
  ORGANISATION = 'ORGANISATION',
  CONTACT = 'CONTACT',
  TASK = 'TASK',
  CONTRACT = 'CONTRACT',
  LEAD = 'LEAD',
  PIPELINE = 'PIPELINE',
  STAGE = 'STAGE',
}

/**
 * Trigger types - what starts a workflow
 * V1: EVENT only. Schedule/Manual/Webhook in future versions.
 */
export enum TriggerType {
  EVENT = 'EVENT',           // Entity event (deal.created, ticket.updated, etc.)
  SCHEDULE = 'SCHEDULE',     // Time-based (future)
  MANUAL = 'MANUAL',         // User/API triggered (future)
  WEBHOOK = 'WEBHOOK',       // External HTTP trigger (future)
}

/**
 * Event types - all possible CRM events
 */
export enum EventType {
  // Deal events
  DEAL_CREATED = 'deal.created',
  DEAL_UPDATED = 'deal.updated',
  DEAL_STAGE_CHANGED = 'deal.stage_changed',
  DEAL_STATUS_CHANGED = 'deal.status_changed',
  DEAL_WON = 'deal.won',
  DEAL_LOST = 'deal.lost',

  // Ticket events
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  TICKET_STATUS_CHANGED = 'ticket.status_changed',

  // Organisation events
  ORGANISATION_CREATED = 'organisation.created',
  ORGANISATION_UPDATED = 'organisation.updated',

  // Contact events
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',

  // Lead events
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',
  LEAD_CONVERTED = 'lead.converted',

  // Task events
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  TASK_OVERDUE = 'task.overdue',
}

/**
 * Action types - what the workflow can do
 * V1: 5 core actions only
 */
export enum ActionType {
  UPDATE_RECORD = 'UPDATE_RECORD',     // Update fields on any entity
  CREATE_TASK = 'CREATE_TASK',         // Create a task linked to entity
  CREATE_DEAL = 'CREATE_DEAL',         // Create a new deal (pipeline handoff)
  CREATE_TICKET = 'CREATE_TICKET',     // Create a support ticket
  CALL_WEBHOOK = 'CALL_WEBHOOK',       // HTTP POST to external URL
}

/**
 * Condition operators - how to compare values
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_OR_EQUAL = 'greater_or_equal',
  LESS_OR_EQUAL = 'less_or_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}

/**
 * Logical operators for condition groups
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

/**
 * Target types - where an action should be applied
 */
export enum TargetType {
  PRIMARY_RECORD = 'PRIMARY_RECORD',   // The entity from the event
  RELATED_ORG = 'RELATED_ORG',         // Via deal.organisation, contact.organisation
  RELATED_CONTACT = 'RELATED_CONTACT', // Via deal.contact
  STATIC_ID = 'STATIC_ID',             // Hardcoded entity ID
  DYNAMIC_PATH = 'DYNAMIC_PATH',       // Field path resolution (e.g., "deal.organisationId")
  NEW_ENTITY = 'NEW_ENTITY',           // Create new entity
}

/**
 * Execution status
 */
export enum ExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  PARTIAL = 'PARTIAL',  // Some actions succeeded, some failed
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * Internal event structure
 * This is what flows through the automation engine
 */
export interface AutomationEvent {
  /** Unique event ID for idempotency */
  eventId: string;

  /** Event type (e.g., "deal.stage_changed") */
  eventType: EventType | string;

  /** Tenant ID for multi-tenancy */
  tenantId: string;

  /** User who triggered the event (optional for system events) */
  actorUserId?: string;

  /** Primary entity type */
  primaryEntity: EntityType;

  /** Primary entity ID */
  primaryEntityId: string;

  /** Full entity snapshot */
  payload: any;

  /** Event metadata */
  metadata: {
    /** Previous values (for update events) */
    previousValues?: Record<string, any>;

    /** Depth for preventing infinite loops */
    depth: number;

    /** Trace ID for tracking event chains */
    traceId: string;

    /** Timestamp */
    timestamp: Date;

    /** Skip automations flag (prevent loops) */
    skipAutomations?: boolean;
  };
}

/**
 * Event context - enriched data for condition evaluation and actions
 * Includes primary entity + related entities
 */
export interface EventContext {
  /** Original event */
  event: AutomationEvent;

  /** Primary entity data */
  primaryEntity: any;

  /** Related entities (loaded on-demand) */
  related: {
    organisation?: any;
    contact?: any;
    deal?: any;
    ticket?: any;
    lead?: any;
    pipeline?: any;
    stage?: any;
    [key: string]: any;
  };

  /** Flat field access for conditions (e.g., context.deal.amount) */
  [key: string]: any;
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/**
 * Main automation workflow
 */
export interface AutomationWorkflow {
  id: string;
  tenantId: string;

  /** Workflow name */
  name: string;

  /** Optional description */
  description?: string;

  /** Is this workflow active? */
  isActive: boolean;

  /** Trigger configuration */
  trigger: AutomationTrigger;

  /** Condition groups (AND/OR logic) */
  conditionGroups: AutomationConditionGroup[];

  /** Actions to execute (in order) */
  actions: AutomationAction[];

  /** Execution constraints */
  executeOnce?: boolean;      // Only execute once per entity
  cooldownMinutes?: number;   // Min time between executions
  maxActionsPerRun?: number;  // Safety limit (default: 50)

  /** System flags */
  isSystem?: boolean;         // Cannot be deleted

  /** Audit fields */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  /** Execution stats */
  lastTriggeredAt?: Date;
  executionCount: number;
}

/**
 * Trigger definition
 */
export interface AutomationTrigger {
  /** Trigger type */
  type: TriggerType;

  /** Trigger configuration (varies by type) */
  config: TriggerConfig;
}

/**
 * Trigger configuration (union type for different trigger types)
 */
export type TriggerConfig = EventTriggerConfig; // | ScheduleTriggerConfig | ManualTriggerConfig | WebhookTriggerConfig

export interface EventTriggerConfig {
  /** Event type to listen for */
  eventType: EventType | string;

  /** Optional entity type filter */
  entityType?: EntityType;
}

// Future trigger configs (not implemented in v1)
export interface ScheduleTriggerConfig {
  cronExpression: string;
  timezone?: string;
}

export interface ManualTriggerConfig {
  allowedUserIds?: string[];
  allowedRoles?: string[];
}

export interface WebhookTriggerConfig {
  webhookId: string;
  secretToken?: string;
}

// ============================================================================
// CONDITIONS
// ============================================================================

/**
 * Condition group (AND/OR logic between groups)
 */
export interface AutomationConditionGroup {
  id: string;

  /** Conditions in this group (always AND within a group) */
  conditions: AutomationCondition[];

  /** How this group combines with the next group */
  logicalOperator: LogicalOperator; // AND | OR
}

/**
 * Single condition
 */
export interface AutomationCondition {
  id: string;

  /** Field path (e.g., "deal.amount", "organisation.country") */
  field: string;

  /** Comparison operator */
  operator: ConditionOperator;

  /** Value to compare against (scalar or array for IN/NOT_IN) */
  value: any;

  /** Type hint for proper comparison */
  valueType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Action definition
 */
export interface AutomationAction {
  id: string;

  /** Action type */
  type: ActionType;

  /** Execution order (1-indexed) */
  order: number;

  /** Target configuration */
  target: ActionTarget;

  /** Action-specific configuration */
  config: ActionConfig;

  /** Optional delay before execution (ms) */
  delayMs?: number;
}

/**
 * Action target definition
 */
export interface ActionTarget {
  /** Target type */
  type: TargetType;

  /** Target configuration (varies by type) */
  config?: {
    /** For STATIC_ID: the entity ID */
    staticId?: string;

    /** For DYNAMIC_PATH: field path to resolve */
    dynamicPath?: string;

    /** For RELATED_*: relationship name */
    relationPath?: string;
  };
}

/**
 * Action configurations (union type for different action types)
 */
export type ActionConfig =
  | UpdateRecordConfig
  | CreateTaskConfig
  | CreateDealConfig
  | CreateTicketConfig
  | CallWebhookConfig;

/**
 * UPDATE_RECORD action config
 */
export interface UpdateRecordConfig {
  type: 'UPDATE_RECORD';

  /** Entity type to update */
  entityType: EntityType;

  /** Fields to update (key-value pairs) */
  fields: Record<string, any>;

  /** Skip automations on this update? */
  skipAutomations?: boolean;
}

/**
 * CREATE_TASK action config
 */
export interface CreateTaskConfig {
  type: 'CREATE_TASK';

  /** Task title (supports templating: {{deal.id}}) */
  titleTemplate: string;

  /** Task description (supports templating) */
  descriptionTemplate?: string;

  /** Priority */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  /** Due date configuration */
  dueInDays?: number;

  /** Assignee configuration */
  assigneeType: 'OWNER_OF_ENTITY' | 'STATIC_USER' | 'CURRENT_USER';
  assigneeId?: string; // For STATIC_USER

  /** Primary context (what the task is linked to) */
  primaryContext: {
    entityType: EntityType;
    entityId: string | 'FROM_EVENT' | 'FROM_TARGET';
  };
}

/**
 * CREATE_DEAL action config
 */
export interface CreateDealConfig {
  type: 'CREATE_DEAL';

  /** Target pipeline ID */
  pipelineId: string;

  /** Initial stage ID */
  stageId: string;

  /** Fields to copy from source entity */
  copyFields?: string[];

  /** Static fields to set */
  setFields?: Record<string, any>;

  /** Link to parent deal (for handoffs) */
  parentDealId?: string | 'FROM_EVENT';
}

/**
 * CREATE_TICKET action config
 */
export interface CreateTicketConfig {
  type: 'CREATE_TICKET';

  /** Ticket title (supports templating) */
  titleTemplate: string;

  /** Ticket description (supports templating) */
  descriptionTemplate?: string;

  /** Ticket type */
  ticketType: string;

  /** Initial status */
  status?: string;

  /** Source */
  source?: string;

  /** Priority */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  /** Link to organisation */
  organisationId?: string | 'FROM_EVENT' | 'FROM_CONTEXT';

  /** Link to contact */
  contactId?: string | 'FROM_EVENT' | 'FROM_CONTEXT';

  /** Link to deal */
  dealId?: string | 'FROM_EVENT' | 'FROM_CONTEXT';

  /** Assignee */
  assigneeId?: string;
}

/**
 * CALL_WEBHOOK action config
 */
export interface CallWebhookConfig {
  type: 'CALL_WEBHOOK';

  /** Target URL */
  url: string;

  /** HTTP method */
  method: 'POST' | 'PUT' | 'PATCH';

  /** Headers */
  headers?: Record<string, string>;

  /** Body (supports templating) */
  body: any;

  /** Retry configuration */
  retries?: number;
  retryDelayMs?: number;

  /** Timeout (ms) */
  timeoutMs?: number;
}

// ============================================================================
// EXECUTION LOGS
// ============================================================================

/**
 * Workflow execution run
 */
export interface AutomationRun {
  id: string;
  tenantId: string;

  /** Workflow that was executed */
  workflowId: string;

  /** Execution status */
  status: ExecutionStatus;

  /** Event that triggered this run */
  eventType: string;
  primaryEntityType: EntityType;
  primaryEntityId: string;

  /** Event payload snapshot */
  eventPayload: any;

  /** Event ID (for idempotency) */
  eventId: string;

  /** Timing */
  triggeredAt: Date;
  finishedAt?: Date;
  durationMs?: number;

  /** Error (if failed) */
  errorMessage?: string;
  errorStack?: string;

  /** Condition evaluation result */
  conditionsMatched: boolean;
  conditionDetails?: any;

  /** Action results summary */
  actionsTotal: number;
  actionsSucceeded: number;
  actionsFailed: number;
  actionsSkipped: number;
}

/**
 * Individual action execution step
 */
export interface AutomationStepRun {
  id: string;

  /** Parent run */
  runId: string;

  /** Action that was executed */
  actionId: string;
  actionType: ActionType;

  /** Execution order */
  order: number;

  /** Status */
  status: ExecutionStatus;

  /** Timing */
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;

  /** Resolved target */
  targetType?: TargetType;
  targetEntityType?: EntityType;
  targetEntityId?: string;

  /** Input/output */
  input?: any;
  output?: any;

  /** Error (if failed) */
  errorMessage?: string;
  errorStack?: string;

  /** Details (action-specific metadata) */
  details?: any;
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

/**
 * Result of a workflow execution
 */
export interface WorkflowExecutionResult {
  run: AutomationRun;
  steps: AutomationStepRun[];
}

/**
 * Result of a single action execution
 */
export interface ActionExecutionResult {
  success: boolean;
  step: AutomationStepRun;
  error?: Error;
}
