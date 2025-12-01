/**
 * Event System
 *
 * Helpers for creating and managing automation events.
 * Events are the trigger mechanism for all automations.
 */

import { nanoid } from 'nanoid';
import {
  AutomationEvent,
  EntityType,
  EventType,
} from '../domain/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum depth for automation chains (prevent infinite loops) */
export const MAX_AUTOMATION_DEPTH = 10;

/** Default tenant ID for single-tenant deployments */
export const DEFAULT_TENANT_ID = 'default';

// ============================================================================
// EVENT CREATION
// ============================================================================

export interface CreateEventOptions {
  /** Event type (e.g., "deal.stage_changed") */
  eventType: EventType | string;

  /** Tenant ID (for multi-tenancy) */
  tenantId?: string;

  /** User who triggered this event */
  actorUserId?: string;

  /** Primary entity type */
  primaryEntity: EntityType;

  /** Primary entity ID */
  primaryEntityId: string;

  /** Full entity data or partial payload */
  payload: any;

  /** Previous values (for update events) */
  previousValues?: Record<string, any>;

  /** Parent event (for chained automations) */
  parentEvent?: AutomationEvent;

  /** Force skip automations */
  skipAutomations?: boolean;
}

/**
 * Create a new automation event
 */
export function createEvent(options: CreateEventOptions): AutomationEvent {
  const parentDepth = options.parentEvent?.metadata.depth ?? 0;
  const parentTraceId = options.parentEvent?.metadata.traceId;

  return {
    eventId: nanoid(),
    eventType: options.eventType,
    tenantId: options.tenantId ?? DEFAULT_TENANT_ID,
    actorUserId: options.actorUserId,
    primaryEntity: options.primaryEntity,
    primaryEntityId: options.primaryEntityId,
    payload: options.payload,
    metadata: {
      previousValues: options.previousValues,
      depth: parentDepth + 1,
      traceId: parentTraceId ?? nanoid(),
      timestamp: new Date(),
      skipAutomations: options.skipAutomations,
    },
  };
}

/**
 * Create a child event (for chained automations)
 * Inherits tenant, trace, and increments depth
 */
export function createChildEvent(
  parent: AutomationEvent,
  options: Omit<CreateEventOptions, 'tenantId' | 'parentEvent'>
): AutomationEvent {
  return createEvent({
    ...options,
    tenantId: parent.tenantId,
    parentEvent: parent,
  });
}

// ============================================================================
// EVENT VALIDATION
// ============================================================================

/**
 * Check if automations should be skipped for this event
 */
export function shouldSkipAutomations(event: AutomationEvent): boolean {
  // Skip if explicitly flagged
  if (event.metadata.skipAutomations) {
    return true;
  }

  // Skip if max depth exceeded
  if (event.metadata.depth > MAX_AUTOMATION_DEPTH) {
    console.warn(
      `Automation depth exceeded for event ${event.eventId}. ` +
      `Depth: ${event.metadata.depth}, Max: ${MAX_AUTOMATION_DEPTH}`
    );
    return true;
  }

  return false;
}

/**
 * Check if an event matches a trigger configuration
 */
export function eventMatchesTrigger(
  event: AutomationEvent,
  triggerEventType: string,
  triggerEntityType?: EntityType
): boolean {
  // Check event type
  if (event.eventType !== triggerEventType) {
    return false;
  }

  // Check entity type if specified
  if (triggerEntityType && event.primaryEntity !== triggerEntityType) {
    return false;
  }

  return true;
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Get changed fields from an update event
 */
export function getChangedFields(event: AutomationEvent): string[] {
  const previousValues = event.metadata.previousValues;
  if (!previousValues) {
    return [];
  }

  return Object.keys(previousValues);
}

/**
 * Check if a specific field changed in an update event
 */
export function fieldChanged(event: AutomationEvent, field: string): boolean {
  return getChangedFields(event).includes(field);
}

/**
 * Get the previous value of a field from an update event
 */
export function getPreviousValue(event: AutomationEvent, field: string): any {
  return event.metadata.previousValues?.[field];
}

/**
 * Get the new value of a field from the payload
 */
export function getNewValue(event: AutomationEvent, field: string): any {
  return event.payload?.[field];
}

/**
 * Check if a field changed to a specific value
 */
export function fieldChangedTo(
  event: AutomationEvent,
  field: string,
  value: any
): boolean {
  if (!fieldChanged(event, field)) {
    return false;
  }
  return getNewValue(event, field) === value;
}

/**
 * Check if a field changed from a specific value
 */
export function fieldChangedFrom(
  event: AutomationEvent,
  field: string,
  value: any
): boolean {
  if (!fieldChanged(event, field)) {
    return false;
  }
  return getPreviousValue(event, field) === value;
}

// ============================================================================
// IDEMPOTENCY
// ============================================================================

/**
 * Generate an idempotency key for an event + workflow combination
 * Use this to prevent duplicate executions
 */
export function generateIdempotencyKey(
  event: AutomationEvent,
  workflowId: string
): string {
  return `${event.eventId}:${workflowId}`;
}

/**
 * Generate a hash for entity + workflow for executeOnce tracking
 */
export function generateExecuteOnceKey(
  entityType: EntityType,
  entityId: string,
  workflowId: string
): string {
  return `${entityType}:${entityId}:${workflowId}`;
}

// ============================================================================
// EVENT BUS (simple in-memory implementation)
// ============================================================================

type EventHandler = (event: AutomationEvent) => Promise<void>;

/**
 * Simple in-memory event bus
 * Replace with Redis/Kafka in production for distributed systems
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to a specific event type
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      const current = this.handlers.get(eventType) ?? [];
      this.handlers.set(
        eventType,
        current.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);

    return () => {
      this.globalHandlers = this.globalHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Publish an event
   */
  async publish(event: AutomationEvent): Promise<void> {
    // Don't publish if automations should be skipped
    if (shouldSkipAutomations(event)) {
      return;
    }

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of typeHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler error for ${event.eventType}:`, error);
      }
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error('Global event handler error:', error);
      }
    }
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}

// Export singleton event bus
export const eventBus = new EventBus();
