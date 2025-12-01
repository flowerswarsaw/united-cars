/**
 * CREATE_TICKET Action Handler
 *
 * Creates a support/service ticket linked to CRM entities.
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
  CreateTicketConfig,
} from '../domain/types';
import { resolveFieldPath } from '../engine/evaluator';
import { ActionHandler } from '../engine/executor';

// ============================================================================
// TYPES
// ============================================================================

export interface TicketCreateData {
  title: string;
  description?: string;
  ticketType: string;
  status: string;
  priority?: string;
  source?: string;
  organisationId?: string;
  contactId?: string;
  dealId?: string;
  assigneeId?: string;
  metadata?: Record<string, any>;
}

export interface TicketRepository {
  create(data: TicketCreateData): Promise<any>;
}

// ============================================================================
// HANDLER
// ============================================================================

export class CreateTicketHandler implements ActionHandler {
  private ticketRepository: TicketRepository;

  constructor(ticketRepository: TicketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute(
    action: AutomationAction,
    context: EventContext,
    runId: string
  ): Promise<ActionExecutionResult> {
    const config = action.config as CreateTicketConfig;

    const step: AutomationStepRun = {
      id: nanoid(),
      runId,
      actionId: action.id,
      actionType: action.type,
      order: action.order,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      targetType: TargetType.NEW_ENTITY,
      targetEntityType: EntityType.TICKET,
      input: config,
    };

    try {
      // Process templates
      const title = this.processTemplate(config.titleTemplate, context);
      const description = config.descriptionTemplate
        ? this.processTemplate(config.descriptionTemplate, context)
        : undefined;

      // Resolve linked entities
      const organisationId = this.resolveEntityId(config.organisationId, context, 'organisation');
      const contactId = this.resolveEntityId(config.contactId, context, 'contact');
      const dealId = this.resolveEntityId(config.dealId, context, 'deal');

      // Create ticket data
      const ticketData: TicketCreateData = {
        title,
        description,
        ticketType: config.ticketType,
        status: config.status ?? 'OPEN',
        priority: config.priority ?? 'MEDIUM',
        source: config.source ?? 'AUTOMATION',
        organisationId,
        contactId,
        dealId,
        assigneeId: config.assigneeId,
        metadata: {
          createdByAutomation: true,
          automationRunId: runId,
          sourceEventId: context.event.eventId,
          sourceEntityType: context.event.primaryEntity,
          sourceEntityId: context.event.primaryEntityId,
        },
      };

      // Create the ticket
      const ticket = await this.ticketRepository.create(ticketData);

      step.targetEntityId = ticket.id;
      step.output = { ticket };
      step.details = {
        title,
        ticketType: config.ticketType,
        organisationId,
        contactId,
        dealId,
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
   * Resolve entity ID from config value
   */
  private resolveEntityId(
    configValue: string | undefined,
    context: EventContext,
    entityKey: 'organisation' | 'contact' | 'deal'
  ): string | undefined {
    if (!configValue) {
      return undefined;
    }

    switch (configValue) {
      case 'FROM_EVENT':
        // Use primary entity if it matches, otherwise try related
        if (context.event.primaryEntity.toLowerCase() === entityKey) {
          return context.event.primaryEntityId;
        }
        return context.related[entityKey]?.id;

      case 'FROM_CONTEXT':
        return context.related[entityKey]?.id ?? context[entityKey]?.id;

      default:
        // Static ID
        return configValue;
    }
  }
}

/**
 * Create a CreateTicket action handler
 */
export function createCreateTicketHandler(
  ticketRepository: TicketRepository
): CreateTicketHandler {
  return new CreateTicketHandler(ticketRepository);
}
