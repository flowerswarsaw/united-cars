/**
 * CREATE_TASK Action Handler
 *
 * Creates a task linked to entities from the event context.
 */

import { nanoid } from 'nanoid';
import {
  AutomationAction,
  EventContext,
  ActionExecutionResult,
  AutomationStepRun,
  ExecutionStatus,
  EntityType,
  TargetType,
  CreateTaskConfig,
} from '../domain/types';
import { resolveFieldPath } from '../engine/evaluator';
import { ActionHandler } from '../engine/executor';

// ============================================================================
// TYPES
// ============================================================================

export interface TaskCreateData {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  assigneeId?: string;
  status?: string;
  dealId?: string;
  organisationId?: string;
  contactId?: string;
}

export interface TaskRepository {
  create(data: TaskCreateData): Promise<any>;
}

// ============================================================================
// HANDLER
// ============================================================================

export class CreateTaskHandler implements ActionHandler {
  private taskRepository: TaskRepository;

  constructor(taskRepository: TaskRepository) {
    this.taskRepository = taskRepository;
  }

  async execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const config = action.config as CreateTaskConfig;

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: TargetType.NEW_ENTITY,
      targetEntityType: EntityType.TASK,
      input: config,
    };

    try {
      // Process templates
      const title = this.processTemplate(config.titleTemplate, context);
      const description = config.descriptionTemplate
        ? this.processTemplate(config.descriptionTemplate, context)
        : undefined;

      // Calculate due date
      const dueDate = config.dueInDays
        ? this.calculateDueDate(config.dueInDays)
        : undefined;

      // Resolve assignee
      const assigneeId = this.resolveAssignee(config, context);

      // Resolve primary context (what the task is linked to)
      const primaryContext = this.resolvePrimaryContext(config, context);

      // Create task data
      const taskData: TaskCreateData = {
        title,
        description,
        priority: config.priority ?? 'MEDIUM',
        dueDate,
        assigneeId,
        status: 'PENDING',
        ...primaryContext,
      };

      // Create the task
      const task = await this.taskRepository.create(taskData);

      step.targetEntityId = task.id;
      step.output = { task };
      step.details = {
        title,
        assigneeId,
        dueDate,
        primaryContext,
      };

      step.finishedAt = new Date();
      step.durationMs = Date.now() - step.startedAt.getTime();

      return {
        success: true,
        step,
      };
    } catch (error: any) {
      step.status = ExecutionStatus.FAILED;
      step.errorMessage = error.message;
      step.finishedAt = new Date();
      step.durationMs = Date.now() - step.startedAt.getTime();

      return {
        success: false,
        step,
        error,
      };
    }
  }

  /**
   * Process a template string, replacing {{field}} with context values
   */
  private processTemplate(template: string, context: EventContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = resolveFieldPath(context, path.trim());
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Calculate due date based on days from now
   */
  private calculateDueDate(daysFromNow: number): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    dueDate.setHours(17, 0, 0, 0); // 5 PM
    return dueDate;
  }

  /**
   * Resolve the assignee ID based on configuration
   */
  private resolveAssignee(config: CreateTaskConfig, context: EventContext): string | undefined {
    switch (config.assigneeType) {
      case 'STATIC_USER':
        return config.assigneeId;

      case 'CURRENT_USER':
        return context.event.actorUserId;

      case 'OWNER_OF_ENTITY':
        // Try to find owner from primary entity
        const ownerId =
          context.primaryEntity?.ownerId ??
          context.primaryEntity?.assignedTo ??
          context.primaryEntity?.userId;
        return ownerId ?? undefined;

      default:
        return undefined;
    }
  }

  /**
   * Resolve primary context (what entities the task is linked to)
   */
  private resolvePrimaryContext(
    config: CreateTaskConfig,
    context: EventContext
  ): { dealId?: string; organisationId?: string; contactId?: string } {
    const result: { dealId?: string; organisationId?: string; contactId?: string } = {};

    // Get entity ID from config
    let entityId: string | undefined;

    if (config.primaryContext.entityId === 'FROM_EVENT') {
      entityId = context.event.primaryEntityId;
    } else if (config.primaryContext.entityId === 'FROM_TARGET') {
      entityId = context.event.primaryEntityId; // Same as FROM_EVENT for tasks
    } else {
      entityId = config.primaryContext.entityId;
    }

    // Set the appropriate relation based on entity type
    switch (config.primaryContext.entityType) {
      case EntityType.DEAL:
        result.dealId = entityId;
        // Also copy organisation from deal if available
        result.organisationId = context.related.organisation?.id;
        break;

      case EntityType.ORGANISATION:
        result.organisationId = entityId;
        break;

      case EntityType.CONTACT:
        result.contactId = entityId;
        result.organisationId = context.related.organisation?.id;
        break;

      case EntityType.TICKET:
        // Link to related entities from ticket
        result.dealId = context.related.deal?.id;
        result.organisationId = context.related.organisation?.id;
        result.contactId = context.related.contact?.id;
        break;
    }

    return result;
  }
}

/**
 * Create a CreateTask action handler
 */
export function createCreateTaskHandler(taskRepository: TaskRepository): CreateTaskHandler {
  return new CreateTaskHandler(taskRepository);
}
