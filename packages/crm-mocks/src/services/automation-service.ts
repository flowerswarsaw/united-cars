/**
 * Automation Service
 *
 * Central orchestrator for automation execution.
 * Uses WorkflowRepository and RunRepository for storage and idempotency.
 */

import {
  AutomationEvent,
  AutomationWorkflow,
  WorkflowExecutionResult,
  WorkflowExecutor,
  createWorkflowExecutor,
  EntityLoader,
  ExecutionStatus,
} from '@united-cars/crm-automation';
import {
  AutomationWorkflowRepository,
  automationWorkflowRepository,
} from '../repositories/automation-workflow-repository';
import {
  AutomationRunRepository,
  automationRunRepository,
} from '../repositories/automation-run-repository';

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface AutomationServiceConfig {
  workflowRepo?: AutomationWorkflowRepository;
  runRepo?: AutomationRunRepository;
  entityLoader: EntityLoader;
  continueOnError?: boolean;
  maxActionsPerRun?: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class AutomationService {
  private workflowRepo: AutomationWorkflowRepository;
  private runRepo: AutomationRunRepository;
  private executor: WorkflowExecutor;
  private initialized = false;

  constructor(config: AutomationServiceConfig) {
    this.workflowRepo = config.workflowRepo ?? automationWorkflowRepository;
    this.runRepo = config.runRepo ?? automationRunRepository;

    this.executor = createWorkflowExecutor(config.entityLoader, {
      maxActionsPerRun: config.maxActionsPerRun ?? 50,
      continueOnError: config.continueOnError ?? true,
      defaultActionDelayMs: 0,
    });
  }

  /**
   * Register action handlers with the executor.
   * Must be called before processing events.
   */
  registerActionHandler(
    actionType: string,
    handler: Parameters<WorkflowExecutor['registerActionHandler']>[1]
  ): void {
    this.executor.registerActionHandler(actionType, handler);
    this.initialized = true;
  }

  /**
   * Get the workflow executor for direct access (e.g., for registering handlers)
   */
  getExecutor(): WorkflowExecutor {
    return this.executor;
  }

  /**
   * Process an automation event.
   * Finds matching workflows and executes them.
   * Returns results for all executed workflows.
   */
  async processEvent(event: AutomationEvent): Promise<WorkflowExecutionResult[]> {
    // 1. Skip if flagged
    if (event.metadata.skipAutomations) {
      return [];
    }

    // 2. Find matching workflows
    const workflows = await this.workflowRepo.getByTenantAndEvent(
      event.tenantId,
      String(event.eventType)
    );

    if (workflows.length === 0) {
      return [];
    }

    // 3. Execute each workflow
    const results: WorkflowExecutionResult[] = [];

    for (const workflow of workflows) {
      const result = await this.executeWorkflowForEvent(workflow, event);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Execute a single workflow for an event.
   * Handles idempotency checking and run recording.
   */
  private async executeWorkflowForEvent(
    workflow: AutomationWorkflow,
    event: AutomationEvent
  ): Promise<WorkflowExecutionResult | null> {
    // Check idempotency
    const alreadyExecuted = await this.runRepo.hasExecutedForEvent(
      workflow.id,
      event.eventId
    );

    if (alreadyExecuted) {
      // Already processed this event for this workflow
      return null;
    }

    // Execute the workflow
    const result = await this.executor.executeWorkflow(workflow, event);

    // Save the run record
    await this.runRepo.create(result.run);

    // Save step records
    if (result.steps.length > 0) {
      await this.runRepo.createSteps(result.steps);
    }

    // Update workflow execution stats
    if (result.run.status !== ExecutionStatus.SKIPPED) {
      await this.workflowRepo.incrementExecutionCount(workflow.id);
    }

    return result;
  }

  /**
   * Get workflow repository for direct access
   */
  getWorkflowRepository(): AutomationWorkflowRepository {
    return this.workflowRepo;
  }

  /**
   * Get run repository for direct access
   */
  getRunRepository(): AutomationRunRepository {
    return this.runRepo;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Lazy-initialized singleton
let automationServiceInstance: AutomationService | null = null;

/**
 * Get or create the automation service singleton.
 * The entity loader must be provided on first call.
 */
export function getAutomationService(entityLoader?: EntityLoader): AutomationService {
  if (!automationServiceInstance) {
    if (!entityLoader) {
      throw new Error(
        'AutomationService not initialized. Provide an EntityLoader on first call.'
      );
    }
    automationServiceInstance = new AutomationService({ entityLoader });
  }
  return automationServiceInstance;
}

/**
 * Initialize the automation service with the given entity loader.
 * Call this during app startup.
 */
export function initAutomationService(entityLoader: EntityLoader): AutomationService {
  automationServiceInstance = new AutomationService({ entityLoader });
  return automationServiceInstance;
}

/**
 * Reset the automation service (for testing)
 */
export function resetAutomationService(): void {
  automationServiceInstance = null;
}
