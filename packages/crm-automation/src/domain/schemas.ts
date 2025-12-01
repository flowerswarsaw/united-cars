/**
 * Automation/Workflow Module - Zod Validation Schemas
 *
 * All schemas for runtime validation of automation types
 */

import { z } from 'zod';
import {
  EntityType,
  TriggerType,
  EventType,
  ActionType,
  ConditionOperator,
  LogicalOperator,
  TargetType,
  ExecutionStatus,
} from './types';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const EntityTypeSchema = z.nativeEnum(EntityType);
export const TriggerTypeSchema = z.nativeEnum(TriggerType);
export const EventTypeSchema = z.nativeEnum(EventType);
export const ActionTypeSchema = z.nativeEnum(ActionType);
export const ConditionOperatorSchema = z.nativeEnum(ConditionOperator);
export const LogicalOperatorSchema = z.nativeEnum(LogicalOperator);
export const TargetTypeSchema = z.nativeEnum(TargetType);
export const ExecutionStatusSchema = z.nativeEnum(ExecutionStatus);

// ============================================================================
// CONDITION SCHEMAS
// ============================================================================

export const AutomationConditionSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.any(),
  valueType: z.enum(['string', 'number', 'boolean', 'date', 'array']).optional(),
});

export const AutomationConditionGroupSchema = z.object({
  id: z.string().min(1),
  conditions: z.array(AutomationConditionSchema),
  logicalOperator: LogicalOperatorSchema,
});

// ============================================================================
// TRIGGER SCHEMAS
// ============================================================================

export const EventTriggerConfigSchema = z.object({
  eventType: z.string().min(1),
  entityType: EntityTypeSchema.optional(),
});

export const ScheduleTriggerConfigSchema = z.object({
  cronExpression: z.string().min(1),
  timezone: z.string().optional(),
});

export const ManualTriggerConfigSchema = z.object({
  allowedUserIds: z.array(z.string()).optional(),
  allowedRoles: z.array(z.string()).optional(),
});

export const WebhookTriggerConfigSchema = z.object({
  webhookId: z.string().min(1),
  secretToken: z.string().optional(),
});

// For v1, only EVENT trigger is supported
// Use the EventTriggerConfigSchema directly
export const TriggerConfigSchema = EventTriggerConfigSchema;

export const AutomationTriggerSchema = z.object({
  type: TriggerTypeSchema,
  config: TriggerConfigSchema,
});

// ============================================================================
// ACTION TARGET SCHEMAS
// ============================================================================

export const ActionTargetConfigSchema = z.object({
  staticId: z.string().optional(),
  dynamicPath: z.string().optional(),
  relationPath: z.string().optional(),
}).optional();

export const ActionTargetSchema = z.object({
  type: TargetTypeSchema,
  config: ActionTargetConfigSchema,
});

// ============================================================================
// ACTION CONFIG SCHEMAS
// ============================================================================

export const UpdateRecordConfigSchema = z.object({
  type: z.literal('UPDATE_RECORD'),
  entityType: EntityTypeSchema,
  fields: z.record(z.any()),
  skipAutomations: z.boolean().optional(),
});

export const CreateTaskConfigSchema = z.object({
  type: z.literal('CREATE_TASK'),
  titleTemplate: z.string().min(1),
  descriptionTemplate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueInDays: z.number().int().min(0).optional(),
  assigneeType: z.enum(['OWNER_OF_ENTITY', 'STATIC_USER', 'CURRENT_USER']),
  assigneeId: z.string().optional(),
  primaryContext: z.object({
    entityType: EntityTypeSchema,
    entityId: z.union([z.string(), z.literal('FROM_EVENT'), z.literal('FROM_TARGET')]),
  }),
});

export const CreateDealConfigSchema = z.object({
  type: z.literal('CREATE_DEAL'),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  copyFields: z.array(z.string()).optional(),
  setFields: z.record(z.any()).optional(),
  parentDealId: z.union([z.string(), z.literal('FROM_EVENT')]).optional(),
});

export const CreateTicketConfigSchema = z.object({
  type: z.literal('CREATE_TICKET'),
  titleTemplate: z.string().min(1),
  descriptionTemplate: z.string().optional(),
  ticketType: z.string().min(1),
  status: z.string().optional(),
  source: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  organisationId: z.union([z.string(), z.literal('FROM_EVENT'), z.literal('FROM_CONTEXT')]).optional(),
  contactId: z.union([z.string(), z.literal('FROM_EVENT'), z.literal('FROM_CONTEXT')]).optional(),
  dealId: z.union([z.string(), z.literal('FROM_EVENT'), z.literal('FROM_CONTEXT')]).optional(),
  assigneeId: z.string().optional(),
});

export const CallWebhookConfigSchema = z.object({
  type: z.literal('CALL_WEBHOOK'),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT', 'PATCH']),
  headers: z.record(z.string()).optional(),
  body: z.any(),
  retries: z.number().int().min(0).max(5).optional(),
  retryDelayMs: z.number().int().min(100).optional(),
  timeoutMs: z.number().int().min(1000).max(30000).optional(),
});

export const ActionConfigSchema = z.discriminatedUnion('type', [
  UpdateRecordConfigSchema,
  CreateTaskConfigSchema,
  CreateDealConfigSchema,
  CreateTicketConfigSchema,
  CallWebhookConfigSchema,
]);

// ============================================================================
// ACTION SCHEMA
// ============================================================================

export const AutomationActionSchema = z.object({
  id: z.string().min(1),
  type: ActionTypeSchema,
  order: z.number().int().min(1),
  target: ActionTargetSchema,
  config: ActionConfigSchema,
  delayMs: z.number().int().min(0).optional(),
});

// ============================================================================
// WORKFLOW SCHEMA
// ============================================================================

export const AutomationWorkflowSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  isActive: z.boolean(),
  trigger: AutomationTriggerSchema,
  conditionGroups: z.array(AutomationConditionGroupSchema),
  actions: z.array(AutomationActionSchema).min(1),
  executeOnce: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  maxActionsPerRun: z.number().int().min(1).max(100).optional(),
  isSystem: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  lastTriggeredAt: z.date().optional(),
  executionCount: z.number().int().min(0),
});

// ============================================================================
// EVENT SCHEMA
// ============================================================================

export const AutomationEventMetadataSchema = z.object({
  previousValues: z.record(z.any()).optional(),
  depth: z.number().int().min(0),
  traceId: z.string().min(1),
  timestamp: z.date(),
  skipAutomations: z.boolean().optional(),
});

export const AutomationEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  tenantId: z.string().min(1),
  actorUserId: z.string().optional(),
  primaryEntity: EntityTypeSchema,
  primaryEntityId: z.string().min(1),
  payload: z.any(),
  metadata: AutomationEventMetadataSchema,
});

// ============================================================================
// EXECUTION LOG SCHEMAS
// ============================================================================

export const AutomationRunSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  workflowId: z.string().min(1),
  status: ExecutionStatusSchema,
  eventType: z.string().min(1),
  primaryEntityType: EntityTypeSchema,
  primaryEntityId: z.string().min(1),
  eventPayload: z.any(),
  eventId: z.string().min(1),
  triggeredAt: z.date(),
  finishedAt: z.date().optional(),
  durationMs: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  conditionsMatched: z.boolean(),
  conditionDetails: z.any().optional(),
  actionsTotal: z.number().int().min(0),
  actionsSucceeded: z.number().int().min(0),
  actionsFailed: z.number().int().min(0),
  actionsSkipped: z.number().int().min(0),
});

export const AutomationStepRunSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  actionId: z.string().min(1),
  actionType: ActionTypeSchema,
  order: z.number().int().min(1),
  status: ExecutionStatusSchema,
  startedAt: z.date(),
  finishedAt: z.date().optional(),
  durationMs: z.number().int().min(0).optional(),
  targetType: TargetTypeSchema.optional(),
  targetEntityType: EntityTypeSchema.optional(),
  targetEntityId: z.string().optional(),
  input: z.any().optional(),
  output: z.any().optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  details: z.any().optional(),
});

// ============================================================================
// CREATE/UPDATE SCHEMAS (for API input validation)
// ============================================================================

export const CreateWorkflowInputSchema = AutomationWorkflowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggeredAt: true,
  executionCount: true,
});

export const UpdateWorkflowInputSchema = AutomationWorkflowSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
  createdBy: true,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AutomationConditionInput = z.infer<typeof AutomationConditionSchema>;
export type AutomationConditionGroupInput = z.infer<typeof AutomationConditionGroupSchema>;
export type AutomationTriggerInput = z.infer<typeof AutomationTriggerSchema>;
export type AutomationActionInput = z.infer<typeof AutomationActionSchema>;
export type AutomationWorkflowInput = z.infer<typeof AutomationWorkflowSchema>;
export type AutomationEventInput = z.infer<typeof AutomationEventSchema>;
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowInputSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowInputSchema>;
