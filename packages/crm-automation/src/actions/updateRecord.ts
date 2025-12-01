/**
 * UPDATE_RECORD Action Handler
 *
 * Updates fields on any entity type.
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
  UpdateRecordConfig,
} from '../domain/types';
import { resolveFieldPath } from '../engine/evaluator';
import { ActionHandler } from '../engine/executor';

// ============================================================================
// TYPES
// ============================================================================

export interface EntityRepository {
  update(id: string, data: Record<string, any>): Promise<any>;
}

export type RepositoryRegistry = Partial<Record<EntityType, EntityRepository>>;

// ============================================================================
// HANDLER
// ============================================================================

export class UpdateRecordHandler implements ActionHandler {
  private repositories: RepositoryRegistry;

  constructor(repositories: RepositoryRegistry) {
    this.repositories = repositories;
  }

  async execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const config = action.config as UpdateRecordConfig;

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: action.target.type,
      input: config,
    };

    try {
      // Resolve target entity ID
      const targetId = this.resolveTargetId(action, context);
      if (!targetId) {
        throw new Error('Could not resolve target entity ID');
      }

      step.targetEntityType = config.entityType;
      step.targetEntityId = targetId;

      // Get repository for entity type
      const repository = this.repositories[config.entityType];
      if (!repository) {
        throw new Error(`No repository for entity type: ${config.entityType}`);
      }

      // Process fields (resolve any dynamic values)
      const processedFields = this.processFields(config.fields, context);

      // Update the entity
      const updatedEntity = await repository.update(targetId, processedFields);

      step.output = {
        updatedFields: Object.keys(processedFields),
        entity: updatedEntity,
      };
      step.details = {
        skipAutomations: config.skipAutomations,
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
   * Resolve the target entity ID based on target type
   */
  private resolveTargetId(action: AutomationAction, context: EventContext): string | null {
    switch (action.target.type) {
      case TargetType.PRIMARY_RECORD:
        return context.event.primaryEntityId;

      case TargetType.STATIC_ID:
        return action.target.config?.staticId ?? null;

      case TargetType.DYNAMIC_PATH:
        const path = action.target.config?.dynamicPath;
        if (path) {
          return resolveFieldPath(context, path) ?? null;
        }
        return null;

      case TargetType.RELATED_ORG:
        return context.related.organisation?.id ?? null;

      case TargetType.RELATED_CONTACT:
        return context.related.contact?.id ?? null;

      default:
        return null;
    }
  }

  /**
   * Process field values, resolving any dynamic references
   */
  private processFields(
    fields: Record<string, any>,
    context: EventContext
  ): Record<string, any> {
    const processed: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Dynamic value - resolve from context
        const path = value.slice(2, -2).trim();
        processed[key] = resolveFieldPath(context, path);
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }
}

/**
 * Create an UpdateRecord action handler
 */
export function createUpdateRecordHandler(
  repositories: RepositoryRegistry
): UpdateRecordHandler {
  return new UpdateRecordHandler(repositories);
}
