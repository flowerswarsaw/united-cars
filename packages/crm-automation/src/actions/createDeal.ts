/**
 * CREATE_DEAL Action Handler
 *
 * Creates a new deal in a specified pipeline.
 * Used for pipeline handoffs (e.g., Dealer -> Integration pipeline).
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
  CreateDealConfig,
} from '../domain/types';
import { resolveFieldPath } from '../engine/evaluator';
import { ActionHandler } from '../engine/executor';

// ============================================================================
// TYPES
// ============================================================================

export interface DealCreateData {
  title: string;
  pipelineId: string;
  stageId: string;
  status?: string;
  amount?: number;
  organisationId?: string;
  contactId?: string;
  parentDealId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface DealRepository {
  create(data: DealCreateData): Promise<any>;
  getById(id: string): Promise<any>;
}

// ============================================================================
// HANDLER
// ============================================================================

export class CreateDealHandler implements ActionHandler {
  private dealRepository: DealRepository;

  constructor(dealRepository: DealRepository) {
    this.dealRepository = dealRepository;
  }

  async execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const config = action.config as CreateDealConfig;

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: TargetType.NEW_ENTITY,
      targetEntityType: EntityType.DEAL,
      input: config,
    };

    try {
      // Get source deal (if creating from a deal event)
      const sourceDeal =
        context.event.primaryEntity === EntityType.DEAL
          ? context.primaryEntity
          : context.related.deal;

      // Build base deal data
      const dealData: DealCreateData = {
        title: this.generateTitle(sourceDeal, config, context),
        pipelineId: config.pipelineId,
        stageId: config.stageId,
        status: 'OPEN',
      };

      // Copy fields from source if specified
      if (config.copyFields && sourceDeal) {
        for (const field of config.copyFields) {
          const value = resolveFieldPath(sourceDeal, field);
          if (value !== undefined) {
            dealData[field] = value;
          }
        }
      }

      // Set static fields
      if (config.setFields) {
        for (const [key, value] of Object.entries(config.setFields)) {
          if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            // Dynamic value
            const path = value.slice(2, -2).trim();
            dealData[key] = resolveFieldPath(context, path);
          } else {
            dealData[key] = value;
          }
        }
      }

      // Set parent deal ID for handoffs
      if (config.parentDealId) {
        if (config.parentDealId === 'FROM_EVENT') {
          dealData.parentDealId = context.event.primaryEntityId;
        } else {
          dealData.parentDealId = config.parentDealId;
        }
      }

      // Copy organisation/contact from source
      if (sourceDeal) {
        dealData.organisationId = dealData.organisationId ?? sourceDeal.organisationId;
        dealData.contactId = dealData.contactId ?? sourceDeal.contactId;
      } else {
        // Try to get from related entities
        dealData.organisationId = dealData.organisationId ?? context.related.organisation?.id;
        dealData.contactId = dealData.contactId ?? context.related.contact?.id;
      }

      // Add metadata for traceability
      dealData.metadata = {
        ...dealData.metadata,
        createdByAutomation: true,
        automationRunId: runId,
        sourceDealId: sourceDeal?.id,
        sourceEventId: context.event.eventId,
      };

      // Create the deal
      const deal = await this.dealRepository.create(dealData);

      step.targetEntityId = deal.id;
      step.output = { deal };
      step.details = {
        pipelineId: config.pipelineId,
        stageId: config.stageId,
        sourceDealId: sourceDeal?.id,
        copiedFields: config.copyFields,
        setFields: config.setFields,
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
   * Generate a title for the new deal
   */
  private generateTitle(
    sourceDeal: any,
    config: CreateDealConfig,
    context: EventContext
  ): string {
    // If setFields has title, use that
    if (config.setFields?.title) {
      const titleValue = config.setFields.title;
      if (typeof titleValue === 'string' && titleValue.startsWith('{{')) {
        const path = titleValue.slice(2, -2).trim();
        return resolveFieldPath(context, path) ?? 'New Deal';
      }
      return String(titleValue);
    }

    // If copying from source deal
    if (sourceDeal?.title) {
      return `${sourceDeal.title} (Handoff)`;
    }

    // If we have an organisation, use that
    if (context.related.organisation?.name) {
      return `${context.related.organisation.name} - New Deal`;
    }

    return 'Automated Deal';
  }
}

/**
 * Create a CreateDeal action handler
 */
export function createCreateDealHandler(dealRepository: DealRepository): CreateDealHandler {
  return new CreateDealHandler(dealRepository);
}
