/**
 * CRM Event Broadcasting
 *
 * Utility functions for broadcasting real-time events to connected SSE clients.
 * Import and call these from API routes when entities change.
 */

import { broadcastEvent } from '@/app/api/crm/events/route';

const DEFAULT_TENANT = 'united-cars';

/**
 * Event data structure
 */
export interface EntityEventData {
  id: string;
  [key: string]: any;
}

// ============================================================================
// DEAL EVENTS
// ============================================================================

export function broadcastDealCreated(deal: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'deal:created', {
    dealId: deal.id,
    deal,
  });
}

export function broadcastDealUpdated(deal: EntityEventData, changes?: Record<string, any>, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'deal:updated', {
    dealId: deal.id,
    deal,
    changes,
  });
}

export function broadcastDealStageChanged(
  deal: EntityEventData,
  fromStageId: string,
  toStageId: string,
  tenantId = DEFAULT_TENANT
): void {
  broadcastEvent(tenantId, 'deal:stage_changed', {
    dealId: deal.id,
    deal,
    fromStageId,
    toStageId,
  });
}

export function broadcastDealWon(deal: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'deal:won', {
    dealId: deal.id,
    deal,
  });
}

export function broadcastDealLost(deal: EntityEventData, lossReason?: string, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'deal:lost', {
    dealId: deal.id,
    deal,
    lossReason,
  });
}

// ============================================================================
// CONTACT EVENTS
// ============================================================================

export function broadcastContactCreated(contact: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'contact:created', {
    contactId: contact.id,
    contact,
  });
}

export function broadcastContactUpdated(contact: EntityEventData, changes?: Record<string, any>, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'contact:updated', {
    contactId: contact.id,
    contact,
    changes,
  });
}

// ============================================================================
// LEAD EVENTS
// ============================================================================

export function broadcastLeadCreated(lead: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'lead:created', {
    leadId: lead.id,
    lead,
  });
}

export function broadcastLeadConverted(lead: EntityEventData, dealId: string, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'lead:converted', {
    leadId: lead.id,
    lead,
    dealId,
  });
}

// ============================================================================
// TICKET EVENTS
// ============================================================================

export function broadcastTicketCreated(ticket: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'ticket:created', {
    ticketId: ticket.id,
    ticket,
  });
}

export function broadcastTicketStatusChanged(
  ticket: EntityEventData,
  fromStatus: string,
  toStatus: string,
  tenantId = DEFAULT_TENANT
): void {
  broadcastEvent(tenantId, 'ticket:status_changed', {
    ticketId: ticket.id,
    ticket,
    fromStatus,
    toStatus,
  });
}

// ============================================================================
// TASK EVENTS
// ============================================================================

export function broadcastTaskCreated(task: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'task:created', {
    taskId: task.id,
    task,
  });
}

export function broadcastTaskCompleted(task: EntityEventData, tenantId = DEFAULT_TENANT): void {
  broadcastEvent(tenantId, 'task:completed', {
    taskId: task.id,
    task,
  });
}

// ============================================================================
// CALL EVENTS
// ============================================================================

export function broadcastCallStatusChanged(
  call: EntityEventData,
  fromStatus: string,
  toStatus: string,
  tenantId = DEFAULT_TENANT
): void {
  broadcastEvent(tenantId, 'call:status_changed', {
    callId: call.id,
    call,
    fromStatus,
    toStatus,
  });
}
