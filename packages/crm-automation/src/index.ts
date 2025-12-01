/**
 * CRM Automation Module
 *
 * A universal automation/workflow engine for the CRM.
 *
 * Mental model: Trigger → Conditions → Actions → Logs
 *
 * @example
 * ```typescript
 * import {
 *   createWorkflowExecutor,
 *   createEvent,
 *   EventType,
 *   EntityType,
 *   createMockRepositories,
 *   registerAllActionHandlers,
 * } from '@united-cars/crm-automation';
 *
 * // Create repositories
 * const repos = createMockRepositories();
 *
 * // Create executor
 * const executor = createWorkflowExecutor(entityLoader);
 *
 * // Register action handlers
 * registerAllActionHandlers(executor, {
 *   repositories: { ... },
 *   taskRepository: { ... },
 *   dealRepository: { ... },
 *   ticketRepository: { ... },
 * });
 *
 * // Create and process an event
 * const event = createEvent({
 *   eventType: EventType.DEAL_STAGE_CHANGED,
 *   primaryEntity: EntityType.DEAL,
 *   primaryEntityId: 'deal-123',
 *   payload: deal,
 * });
 *
 * const results = await executor.processEvent(event, workflows);
 * ```
 */

// ============================================================================
// DOMAIN - Types and Schemas
// ============================================================================

export {
  // Enums
  EntityType,
  TriggerType,
  EventType,
  ActionType,
  ConditionOperator,
  LogicalOperator,
  TargetType,
  ExecutionStatus,
  // Event types
  type AutomationEvent,
  type EventContext,
  // Workflow types
  type AutomationWorkflow,
  type AutomationTrigger,
  type TriggerConfig,
  type EventTriggerConfig,
  type ScheduleTriggerConfig,
  type ManualTriggerConfig,
  type WebhookTriggerConfig,
  // Condition types
  type AutomationConditionGroup,
  type AutomationCondition,
  // Action types
  type AutomationAction,
  type ActionTarget,
  type ActionConfig,
  type UpdateRecordConfig,
  type CreateTaskConfig,
  type CreateDealConfig,
  type CreateTicketConfig,
  type CallWebhookConfig,
  // Execution types
  type AutomationRun,
  type AutomationStepRun,
  type WorkflowExecutionResult,
  type ActionExecutionResult,
} from './domain/types';

export {
  // Schemas
  EntityTypeSchema,
  TriggerTypeSchema,
  EventTypeSchema,
  ActionTypeSchema,
  ConditionOperatorSchema,
  LogicalOperatorSchema,
  TargetTypeSchema,
  ExecutionStatusSchema,
  AutomationConditionSchema,
  AutomationConditionGroupSchema,
  AutomationTriggerSchema,
  AutomationActionSchema,
  AutomationWorkflowSchema,
  AutomationEventSchema,
  AutomationRunSchema,
  AutomationStepRunSchema,
  CreateWorkflowInputSchema,
  UpdateWorkflowInputSchema,
  // Schema input types
  type AutomationConditionInput,
  type AutomationConditionGroupInput,
  type AutomationTriggerInput,
  type AutomationActionInput,
  type AutomationWorkflowInput,
  type AutomationEventInput,
  type CreateWorkflowInput,
  type UpdateWorkflowInput,
} from './domain/schemas';

// ============================================================================
// ENGINE - Core execution logic
// ============================================================================

export {
  // Evaluator
  ConditionEvaluator,
  conditionEvaluator,
  evaluateCondition,
  evaluateConditionGroup,
  evaluateConditionGroups,
  resolveFieldPath,
  compareValues,
  type ConditionEvaluationResult,
  type GroupEvaluationResult,
  type EvaluationResult,
} from './engine/evaluator';

export {
  // Context
  ContextBuilder,
  MockEntityLoader,
  buildSimpleContext,
  type EntityLoader,
} from './engine/context';

export {
  // Events
  MAX_AUTOMATION_DEPTH,
  DEFAULT_TENANT_ID,
  createEvent,
  createChildEvent,
  shouldSkipAutomations,
  eventMatchesTrigger,
  getChangedFields,
  fieldChanged,
  getPreviousValue,
  getNewValue,
  fieldChangedTo,
  fieldChangedFrom,
  generateIdempotencyKey,
  generateExecuteOnceKey,
  EventBus,
  eventBus,
  type CreateEventOptions,
} from './engine/events';

export {
  // Executor
  WorkflowExecutor,
  createWorkflowExecutor,
  type ExecutorConfig,
  type ActionHandler,
} from './engine/executor';

// ============================================================================
// ACTIONS - Action handlers
// ============================================================================

export {
  // Handlers
  UpdateRecordHandler,
  CreateTaskHandler,
  CreateDealHandler,
  CreateTicketHandler,
  CallWebhookHandler,
  FetchHttpClient,
  // Factories
  createUpdateRecordHandler,
  createCreateTaskHandler,
  createCreateDealHandler,
  createCreateTicketHandler,
  createCallWebhookHandler,
  createAllActionHandlers,
  registerAllActionHandlers,
  // Types
  type EntityRepository,
  type RepositoryRegistry,
  type TaskRepository,
  type TaskCreateData,
  type DealRepository,
  type DealCreateData,
  type TicketRepository,
  type TicketCreateData,
  type HttpClient,
  type WebhookResult,
  type ActionHandlerConfig,
} from './actions';

// ============================================================================
// INFRASTRUCTURE - Repositories
// ============================================================================

export {
  // Mock repositories
  MockWorkflowRepository,
  MockRunRepository,
  MockStepRunRepository,
  MockIdempotencyRepository,
  createMockRepositories,
  // Repository interfaces
  type WorkflowRepository,
  type RunRepository,
  type StepRunRepository,
  type IdempotencyRepository,
  type AutomationRepositories,
} from './infra/repositories';
