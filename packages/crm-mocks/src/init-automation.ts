/**
 * Automation System Initialization
 *
 * Sets up the automation service with:
 * - Entity loader for resolving entity data
 * - Action handlers for workflow execution
 * - Event emission utilities for API routes
 */

import {
  createEvent,
  registerAllActionHandlers,
  EventType,
  EntityType,
  type AutomationEvent,
  type EntityLoader,
} from '@united-cars/crm-automation';
import { initAutomationService, getAutomationService } from './services/automation-service';

let initialized = false;

/**
 * Create entity loader that resolves entities from mock repositories
 */
function createEntityLoader(): EntityLoader {
  return {
    async loadEntity(type: EntityType, id: string) {
      try {
        switch (type) {
          case EntityType.DEAL: {
            const { dealRepository } = await import('./seeds');
            return await dealRepository.get(id);
          }
          case EntityType.LEAD: {
            const { leadRepository } = await import('./seeds');
            return await leadRepository.get(id);
          }
          case EntityType.CONTACT: {
            const { contactRepository } = await import('./seeds');
            return await contactRepository.get(id);
          }
          case EntityType.ORGANISATION: {
            const { organisationRepository } = await import('./seeds');
            return await organisationRepository.get(id);
          }
          case EntityType.TASK: {
            const { taskRepository } = await import('./seeds');
            return await taskRepository.get(id);
          }
          case EntityType.TICKET: {
            const { ticketRepository } = await import('./repositories');
            return await ticketRepository.get(id);
          }
          case EntityType.CONTRACT: {
            const { contractRepository } = await import('./repositories');
            return await contractRepository.get(id);
          }
          default:
            return undefined;
        }
      } catch (error) {
        console.error(`[Automation] Failed to load ${type} with id ${id}:`, error);
        return undefined;
      }
    },
  };
}

/**
 * Initialize automation system with entity loader and action handlers
 */
export async function initAutomation() {
  if (initialized) return;

  try {
    // Create entity loader
    const entityLoader = createEntityLoader();

    // Initialize service
    const service = initAutomationService(entityLoader);

    // Get repositories for action handlers
    const { taskRepository, dealRepository } = await import('./seeds');
    const { ticketRepository, contractRepository, organisationRepository } = await import('./repositories');
    const { contactRepository, leadRepository, pipelineRepository } = await import('./seeds');

    // Create repository registry for action handlers
    const repositoryRegistry = {
      DEAL: dealRepository,
      LEAD: leadRepository,
      CONTACT: contactRepository,
      ORGANISATION: organisationRepository,
      TASK: taskRepository,
      TICKET: ticketRepository,
      CONTRACT: contractRepository,
    };

    // Register all action handlers
    registerAllActionHandlers(service.getExecutor(), {
      repositories: repositoryRegistry,
      taskRepository: {
        create: async (data: any) => {
          const task = await taskRepository.create({
            ...data,
            tenantId: data.tenantId || 'united-cars',
            status: 'PENDING',
          });
          return task;
        },
      },
      dealRepository: {
        create: async (data: any) => {
          const deal = await dealRepository.create({
            ...data,
            tenantId: data.tenantId || 'united-cars',
          });
          return deal;
        },
      },
      ticketRepository: {
        create: async (data: any) => {
          const ticket = await ticketRepository.create({
            ...data,
            tenantId: data.tenantId || 'united-cars',
          });
          return ticket;
        },
      },
    });

    console.log('[CRM-MOCKS] Automation system initialized');
    initialized = true;
  } catch (error) {
    console.error('[CRM-MOCKS] Failed to initialize automation:', error);
  }
}

/**
 * Emit an automation event for processing
 * Call this from API routes when entities change
 */
export async function emitAutomationEvent(
  eventType: EventType,
  entityType: EntityType,
  entityId: string,
  payload: any,
  tenantId: string = 'united-cars',
  changes?: { field: string; oldValue: any; newValue: any }[]
): Promise<void> {
  try {
    // Ensure automation is initialized
    await initAutomation();

    const service = getAutomationService();

    const event = createEvent({
      eventType,
      primaryEntity: entityType,
      primaryEntityId: entityId,
      payload,
      tenantId,
      changes,
    });

    // Process the event
    const results = await service.processEvent(event);

    if (results.length > 0) {
      console.log(`[Automation] Processed ${results.length} workflow(s) for ${eventType}`);
    }
  } catch (error) {
    console.error('[Automation] Failed to process event:', error);
    // Don't throw - automation failures shouldn't break the main operation
  }
}

/**
 * Helper to emit deal events
 */
export const dealEvents = {
  created: (deal: any, tenantId?: string) =>
    emitAutomationEvent(EventType.DEAL_CREATED, EntityType.DEAL, deal.id, deal, tenantId),

  updated: (deal: any, changes: { field: string; oldValue: any; newValue: any }[], tenantId?: string) =>
    emitAutomationEvent(EventType.DEAL_UPDATED, EntityType.DEAL, deal.id, deal, tenantId, changes),

  stageChanged: (deal: any, oldStageId: string, newStageId: string, tenantId?: string) =>
    emitAutomationEvent(
      EventType.DEAL_STAGE_CHANGED,
      EntityType.DEAL,
      deal.id,
      deal,
      tenantId,
      [{ field: 'stageId', oldValue: oldStageId, newValue: newStageId }]
    ),

  won: (deal: any, tenantId?: string) =>
    emitAutomationEvent(EventType.DEAL_WON, EntityType.DEAL, deal.id, deal, tenantId),

  lost: (deal: any, tenantId?: string) =>
    emitAutomationEvent(EventType.DEAL_LOST, EntityType.DEAL, deal.id, deal, tenantId),
};

/**
 * Helper to emit lead events
 */
export const leadEvents = {
  created: (lead: any, tenantId?: string) =>
    emitAutomationEvent(EventType.LEAD_CREATED, EntityType.LEAD, lead.id, lead, tenantId),

  updated: (lead: any, changes: { field: string; oldValue: any; newValue: any }[], tenantId?: string) =>
    emitAutomationEvent(EventType.LEAD_UPDATED, EntityType.LEAD, lead.id, lead, tenantId, changes),

  converted: (lead: any, dealId: string, tenantId?: string) =>
    emitAutomationEvent(
      EventType.LEAD_CONVERTED,
      EntityType.LEAD,
      lead.id,
      { ...lead, convertedToDealId: dealId },
      tenantId
    ),
};

/**
 * Helper to emit contact events
 */
export const contactEvents = {
  created: (contact: any, tenantId?: string) =>
    emitAutomationEvent(EventType.CONTACT_CREATED, EntityType.CONTACT, contact.id, contact, tenantId),

  updated: (contact: any, changes: { field: string; oldValue: any; newValue: any }[], tenantId?: string) =>
    emitAutomationEvent(EventType.CONTACT_UPDATED, EntityType.CONTACT, contact.id, contact, tenantId, changes),
};

/**
 * Helper to emit task events
 */
export const taskEvents = {
  created: (task: any, tenantId?: string) =>
    emitAutomationEvent(EventType.TASK_CREATED, EntityType.TASK, task.id, task, tenantId),

  completed: (task: any, tenantId?: string) =>
    emitAutomationEvent(EventType.TASK_COMPLETED, EntityType.TASK, task.id, task, tenantId),

  overdue: (task: any, tenantId?: string) =>
    emitAutomationEvent(EventType.TASK_OVERDUE, EntityType.TASK, task.id, task, tenantId),
};

/**
 * Helper to emit ticket events
 */
export const ticketEvents = {
  created: (ticket: any, tenantId?: string) =>
    emitAutomationEvent(EventType.TICKET_CREATED, EntityType.TICKET, ticket.id, ticket, tenantId),

  statusChanged: (ticket: any, oldStatus: string, newStatus: string, tenantId?: string) =>
    emitAutomationEvent(
      EventType.TICKET_STATUS_CHANGED,
      EntityType.TICKET,
      ticket.id,
      ticket,
      tenantId,
      [{ field: 'status', oldValue: oldStatus, newValue: newStatus }]
    ),
};

// Auto-initialize on server-side import
if (typeof window === 'undefined') {
  initAutomation();
}
