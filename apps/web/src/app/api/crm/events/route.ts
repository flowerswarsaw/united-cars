import { NextRequest } from 'next/server';

/**
 * Server-Sent Events (SSE) endpoint for real-time CRM updates
 *
 * This endpoint provides a real-time stream of CRM events to connected clients.
 * Use EventSource in the browser to connect and receive updates.
 *
 * Events include:
 * - deal:created, deal:updated, deal:stage_changed, deal:won, deal:lost
 * - contact:created, contact:updated
 * - lead:created, lead:converted
 * - ticket:created, ticket:status_changed
 * - task:created, task:completed
 * - call:status_changed
 *
 * @example
 * const eventSource = new EventSource('/api/crm/events');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Received event:', data);
 * };
 */

// Store active connections per tenant
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Register a new SSE connection
 */
function addConnection(tenantId: string, controller: ReadableStreamDefaultController): void {
  if (!connections.has(tenantId)) {
    connections.set(tenantId, new Set());
  }
  connections.get(tenantId)!.add(controller);
}

/**
 * Remove a disconnected SSE connection
 */
function removeConnection(tenantId: string, controller: ReadableStreamDefaultController): void {
  const tenantConnections = connections.get(tenantId);
  if (tenantConnections) {
    tenantConnections.delete(controller);
    if (tenantConnections.size === 0) {
      connections.delete(tenantId);
    }
  }
}

/**
 * Broadcast an event to all connected clients for a tenant
 */
export function broadcastEvent(
  tenantId: string,
  eventType: string,
  data: Record<string, any>
): void {
  const tenantConnections = connections.get(tenantId);
  if (!tenantConnections || tenantConnections.size === 0) {
    return;
  }

  const message = formatSSEMessage(eventType, data);
  const encoder = new TextEncoder();
  const chunk = encoder.encode(message);

  for (const controller of tenantConnections) {
    try {
      controller.enqueue(chunk);
    } catch (error) {
      // Connection closed, remove it
      removeConnection(tenantId, controller);
    }
  }
}

/**
 * Format a message for SSE
 */
function formatSSEMessage(eventType: string, data: Record<string, any>): string {
  const payload = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  });

  return `event: ${eventType}\ndata: ${payload}\n\n`;
}

/**
 * GET /api/crm/events
 * SSE endpoint for real-time updates
 */
export async function GET(request: NextRequest) {
  // For now, use a default tenant (in production, extract from auth)
  const tenantId = 'united-cars';

  // Create the SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to active connections
      addConnection(tenantId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          formatSSEMessage('connected', {
            message: 'Connected to CRM event stream',
            tenantId,
          })
        )
      );

      // Send periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`: heartbeat ${Date.now()}\n\n`)
          );
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // Every 30 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeConnection(tenantId, controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Get the count of active connections
 */
export function getConnectionCount(tenantId?: string): number {
  if (tenantId) {
    return connections.get(tenantId)?.size || 0;
  }
  let total = 0;
  for (const set of connections.values()) {
    total += set.size;
  }
  return total;
}
