/**
 * Workflow Executor
 *
 * The core execution engine for automations.
 * Orchestrates: Event → Find Matching Workflows → Evaluate Conditions → Execute Actions → Log Results
 */

import { nanoid } from 'nanoid';
import {
  AutomationEvent,
  AutomationWorkflow,
  AutomationAction,
  AutomationRun,
  AutomationStepRun,
  EventContext,
  ExecutionStatus,
  ActionExecutionResult,
  WorkflowExecutionResult,
  TriggerType,
  EventTriggerConfig,
} from '../domain/types';
import { conditionEvaluator, EvaluationResult } from './evaluator';
import { ContextBuilder, EntityLoader } from './context';
import { shouldSkipAutomations, eventMatchesTrigger } from './events';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutorConfig {
  /** Maximum actions per workflow run (safety limit) */
  maxActionsPerRun: number;

  /** Default delay between actions (ms) */
  defaultActionDelayMs: number;

  /** Entity loader for building context */
  entityLoader: EntityLoader;

  /** Whether to throw on action errors or continue */
  continueOnError: boolean;
}

export interface ActionHandler {
  execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult>;
}

// ============================================================================
// WORKFLOW EXECUTOR
// ============================================================================

export class WorkflowExecutor {
  private config: ExecutorConfig;
  private contextBuilder: ContextBuilder;
  private actionHandlers: Map<string, ActionHandler> = new Map();

  constructor(config: ExecutorConfig) {
    this.config = config;
    this.contextBuilder = new ContextBuilder(config.entityLoader);
  }

  /**
   * Register an action handler
   */
  registerActionHandler(actionType: string, handler: ActionHandler): void {
    this.actionHandlers.set(actionType, handler);
  }

  /**
   * Execute a workflow for an event
   */
  async executeWorkflow(
    workflow: AutomationWorkflow,
    event: AutomationEvent
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const runId = nanoid();

    // Initialize run record
    const run: AutomationRun = {
      id: runId,
      tenantId: event.tenantId,
      workflowId: workflow.id,
      status: ExecutionStatus.SUCCESS,
      eventType: String(event.eventType),
      primaryEntityType: event.primaryEntity,
      primaryEntityId: event.primaryEntityId,
      eventPayload: event.payload,
      eventId: event.eventId,
      triggeredAt: new Date(),
      conditionsMatched: false,
      actionsTotal: workflow.actions.length,
      actionsSucceeded: 0,
      actionsFailed: 0,
      actionsSkipped: 0,
    };

    const steps: AutomationStepRun[] = [];

    try {
      // Check if automations should be skipped
      if (shouldSkipAutomations(event)) {
        run.status = ExecutionStatus.SKIPPED;
        run.actionsSkipped = workflow.actions.length;
        run.finishedAt = new Date();
        run.durationMs = Date.now() - startTime;
        return { run, steps };
      }

      // Build context
      const context = await this.contextBuilder.buildContext(event);

      // Evaluate conditions
      const evaluationResult = conditionEvaluator.evaluate(
        workflow.conditionGroups,
        context
      );

      run.conditionsMatched = evaluationResult.matched;
      run.conditionDetails = evaluationResult;

      // If conditions don't match, skip execution
      if (!evaluationResult.matched) {
        run.status = ExecutionStatus.SKIPPED;
        run.actionsSkipped = workflow.actions.length;
        run.finishedAt = new Date();
        run.durationMs = Date.now() - startTime;
        return { run, steps };
      }

      // Execute actions
      const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);
      const maxActions = workflow.maxActionsPerRun ?? this.config.maxActionsPerRun;

      for (let i = 0; i < Math.min(sortedActions.length, maxActions); i++) {
        const action = sortedActions[i];

        // Apply delay if specified
        if (action.delayMs && action.delayMs > 0) {
          await this.delay(action.delayMs);
        } else if (i > 0 && this.config.defaultActionDelayMs > 0) {
          await this.delay(this.config.defaultActionDelayMs);
        }

        // Execute action
        const stepResult = await this.executeAction(action, context, runId);
        steps.push(stepResult.step);

        if (stepResult.success) {
          run.actionsSucceeded++;
        } else {
          run.actionsFailed++;

          // Stop on error if configured
          if (!this.config.continueOnError) {
            run.status = ExecutionStatus.PARTIAL;
            run.errorMessage = stepResult.error?.message;
            break;
          }
        }
      }

      // Mark remaining actions as skipped if we hit the limit
      if (sortedActions.length > maxActions) {
        run.actionsSkipped = sortedActions.length - maxActions;
      }

      // Determine final status
      if (run.actionsFailed === 0) {
        run.status = ExecutionStatus.SUCCESS;
      } else if (run.actionsSucceeded > 0) {
        run.status = ExecutionStatus.PARTIAL;
      } else {
        run.status = ExecutionStatus.FAILED;
      }
    } catch (error: any) {
      run.status = ExecutionStatus.FAILED;
      run.errorMessage = error.message;
      run.actionsSkipped = workflow.actions.length - run.actionsSucceeded - run.actionsFailed;
    }

    run.finishedAt = new Date();
    run.durationMs = Date.now() - startTime;

    return { run, steps };
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: action.target.type,
      input: action.config,
    };

    try {
      const handler = this.actionHandlers.get(action.type);

      if (!handler) {
        throw new Error(`No handler registered for action type: ${action.type}`);
      }

      const result = await handler.execute(action, context, runId);

      step.status = result.success ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED;
      step.output = result.step.output;
      step.targetEntityType = result.step.targetEntityType;
      step.targetEntityId = result.step.targetEntityId;
      step.details = result.step.details;

      if (!result.success) {
        step.errorMessage = result.error?.message;
      }

      step.finishedAt = new Date();
      step.durationMs = Date.now() - startTime;

      return result;
    } catch (error: any) {
      step.status = ExecutionStatus.FAILED;
      step.errorMessage = error.message;
      step.finishedAt = new Date();
      step.durationMs = Date.now() - startTime;

      return {
        success: false,
        step,
        error,
      };
    }
  }

  /**
   * Find workflows that match an event
   */
  findMatchingWorkflows(
    event: AutomationEvent,
    workflows: AutomationWorkflow[]
  ): AutomationWorkflow[] {
    return workflows.filter((workflow) => {
      // Must be active
      if (!workflow.isActive) {
        return false;
      }

      // Must match tenant
      if (workflow.tenantId !== event.tenantId) {
        return false;
      }

      // Check trigger
      if (workflow.trigger.type !== TriggerType.EVENT) {
        return false;
      }

      const triggerConfig = workflow.trigger.config as EventTriggerConfig;

      return eventMatchesTrigger(
        event,
        triggerConfig.eventType,
        triggerConfig.entityType
      );
    });
  }

  /**
   * Process an event: find matching workflows and execute them
   */
  async processEvent(
    event: AutomationEvent,
    workflows: AutomationWorkflow[]
  ): Promise<WorkflowExecutionResult[]> {
    const matchingWorkflows = this.findMatchingWorkflows(event, workflows);
    const results: WorkflowExecutionResult[] = [];

    for (const workflow of matchingWorkflows) {
      const result = await this.executeWorkflow(workflow, event);
      results.push(result);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a workflow executor with default configuration
 */
export function createWorkflowExecutor(
  entityLoader: EntityLoader,
  options?: Partial<ExecutorConfig>
): WorkflowExecutor {
  const config: ExecutorConfig = {
    maxActionsPerRun: options?.maxActionsPerRun ?? 50,
    defaultActionDelayMs: options?.defaultActionDelayMs ?? 0,
    entityLoader,
    continueOnError: options?.continueOnError ?? true,
  };

  return new WorkflowExecutor(config);
}
