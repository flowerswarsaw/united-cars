/**
 * CRM Event Emitter
 *
 * Emits automation events when CRM entities change.
 * Integrates with the automation service for workflow processing.
 */

import {
  createEvent,
  eventBus,
  EventType,
  EntityType,
  AutomationEvent,
} from '@united-cars/crm-automation';
import { getAutomationService } from './automation-service';
import { crmEntityLoader } from './entity-loader';

// Default tenant ID for single-tenant deployment
const DEFAULT_TENANT = 'united-cars';

// ============================================================================
// EMIT OPTIONS
// ============================================================================

export interface EmitEventOptions {
  /** User who triggered the event */
  actorUserId?: string;

  /** Skip automation processing */
  skipAutomations?: boolean;

  /** Previous values (for update events) */
  previousValues?: Record<string, any>;
}

// ============================================================================
// DEAL EVENTS
// ============================================================================

export async function emitDealCreated(
  deal: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_CREATED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitDealUpdated(
  deal: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_UPDATED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    previousValues: options.previousValues,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitDealStageChanged(
  deal: any,
  previousStageId: string,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_STAGE_CHANGED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    previousValues: {
      ...options.previousValues,
      stageId: previousStageId,
    },
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitDealStatusChanged(
  deal: any,
  previousStatus: string,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_STATUS_CHANGED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    previousValues: {
      ...options.previousValues,
      status: previousStatus,
    },
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitDealWon(
  deal: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_WON,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    previousValues: options.previousValues,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitDealLost(
  deal: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.DEAL_LOST,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.DEAL,
    primaryEntityId: deal.id,
    payload: deal,
    previousValues: options.previousValues,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

// ============================================================================
// TICKET EVENTS
// ============================================================================

export async function emitTicketCreated(
  ticket: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.TICKET_CREATED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.TICKET,
    primaryEntityId: ticket.id,
    payload: ticket,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitTicketUpdated(
  ticket: any,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.TICKET_UPDATED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.TICKET,
    primaryEntityId: ticket.id,
    payload: ticket,
    previousValues: options.previousValues,
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitTicketAssigned(
  ticket: any,
  previousAssigneeId: string | undefined,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.TICKET_ASSIGNED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.TICKET,
    primaryEntityId: ticket.id,
    payload: ticket,
    previousValues: {
      ...options.previousValues,
      assigneeId: previousAssigneeId,
    },
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

export async function emitTicketStatusChanged(
  ticket: any,
  previousStatus: string,
  options: EmitEventOptions = {}
): Promise<AutomationEvent> {
  const event = createEvent({
    eventType: EventType.TICKET_STATUS_CHANGED,
    tenantId: DEFAULT_TENANT,
    actorUserId: options.actorUserId,
    primaryEntity: EntityType.TICKET,
    primaryEntityId: ticket.id,
    payload: ticket,
    previousValues: {
      ...options.previousValues,
      status: previousStatus,
    },
    skipAutomations: options.skipAutomations,
  });

  await processEvent(event);
  return event;
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process an event through the automation service.
 * Also publishes to the event bus for any other listeners.
 */
async function processEvent(event: AutomationEvent): Promise<void> {
  // Skip if explicitly flagged
  if (event.metadata.skipAutomations) {
    return;
  }

  try {
    // Initialize automation service with entity loader if not already done
    const automationService = getAutomationService(crmEntityLoader);

    // Process through automation workflows
    const results = await automationService.processEvent(event);

    if (results.length > 0) {
      console.log(
        `[Automation] Processed ${results.length} workflow(s) for ${event.eventType}`
      );
    }

    // Also publish to event bus for any other listeners
    await eventBus.publish(event);
  } catch (error) {
    console.error(`[Automation] Error processing event ${event.eventType}:`, error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const crmEventEmitter = {
  // Deal events
  emitDealCreated,
  emitDealUpdated,
  emitDealStageChanged,
  emitDealStatusChanged,
  emitDealWon,
  emitDealLost,

  // Ticket events
  emitTicketCreated,
  emitTicketUpdated,
  emitTicketAssigned,
  emitTicketStatusChanged,
};
