'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CRM Event types
 */
export type CRMEventType =
  | 'connected'
  | 'deal:created'
  | 'deal:updated'
  | 'deal:stage_changed'
  | 'deal:won'
  | 'deal:lost'
  | 'contact:created'
  | 'contact:updated'
  | 'lead:created'
  | 'lead:converted'
  | 'ticket:created'
  | 'ticket:status_changed'
  | 'task:created'
  | 'task:completed'
  | 'call:status_changed';

/**
 * CRM Event payload
 */
export interface CRMEvent {
  type: CRMEventType;
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Connection state
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Event handler function
 */
export type CRMEventHandler = (event: CRMEvent) => void;

/**
 * Options for the useCRMEvents hook
 */
export interface UseCRMEventsOptions {
  /** Enable/disable the connection (default: true) */
  enabled?: boolean;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Event types to listen for (default: all) */
  eventTypes?: CRMEventType[];
  /** Callback when connection state changes */
  onStateChange?: (state: ConnectionState) => void;
}

/**
 * Hook for subscribing to real-time CRM events via Server-Sent Events
 *
 * @example
 * // Listen to all events
 * const { connectionState, lastEvent } = useCRMEvents({
 *   onEvent: (event) => {
 *     if (event.type === 'deal:stage_changed') {
 *       // Refresh deal data
 *       refetchDeals();
 *     }
 *   }
 * });
 *
 * @example
 * // Listen to specific events
 * const { lastEvent } = useCRMEvents({
 *   eventTypes: ['deal:created', 'deal:updated'],
 *   onEvent: (event) => console.log('Deal event:', event)
 * });
 */
export function useCRMEvents(
  onEvent?: CRMEventHandler,
  options: UseCRMEventsOptions = {}
) {
  const {
    enabled = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    eventTypes,
    onStateChange,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastEvent, setLastEvent] = useState<CRMEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state and notify
  const updateState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    onStateChange?.(state);
  }, [onStateChange]);

  // Handle incoming event
  const handleEvent = useCallback((event: CRMEvent) => {
    // Filter by event types if specified
    if (eventTypes && !eventTypes.includes(event.type)) {
      return;
    }

    setLastEvent(event);
    onEvent?.(event);
  }, [eventTypes, onEvent]);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    updateState('connecting');
    setError(null);

    const eventSource = new EventSource('/api/crm/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      updateState('connected');
      reconnectAttemptRef.current = 0;
    };

    eventSource.onerror = () => {
      updateState('error');
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt reconnection
      if (autoReconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
        reconnectAttemptRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else {
        setError(new Error('Failed to connect to event stream'));
        updateState('disconnected');
      }
    };

    // Listen to generic messages
    eventSource.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as CRMEvent;
        handleEvent(event);
      } catch {
        // Ignore parse errors
      }
    };

    // Listen to named events
    const eventHandler = (messageEvent: MessageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as CRMEvent;
        handleEvent(event);
      } catch {
        // Ignore parse errors
      }
    };

    // Add listeners for all event types
    const allEventTypes: CRMEventType[] = [
      'connected',
      'deal:created',
      'deal:updated',
      'deal:stage_changed',
      'deal:won',
      'deal:lost',
      'contact:created',
      'contact:updated',
      'lead:created',
      'lead:converted',
      'ticket:created',
      'ticket:status_changed',
      'task:created',
      'task:completed',
      'call:status_changed',
    ];

    for (const eventType of allEventTypes) {
      eventSource.addEventListener(eventType, eventHandler);
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectDelay, updateState, handleEvent]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateState('disconnected');
  }, [updateState]);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    connectionState,
    lastEvent,
    error,
    isConnected: connectionState === 'connected',
    reconnect: connect,
    disconnect,
  };
}

/**
 * Hook for listening to specific entity events
 *
 * @example
 * // Auto-refresh when deals change
 * useCRMEntityEvents('deal', (event) => {
 *   console.log('Deal changed:', event.data);
 *   refetchDeals();
 * });
 */
export function useCRMEntityEvents(
  entityType: 'deal' | 'contact' | 'lead' | 'ticket' | 'task' | 'call',
  onEvent: CRMEventHandler,
  options: Omit<UseCRMEventsOptions, 'eventTypes'> = {}
) {
  const eventTypeMap: Record<string, CRMEventType[]> = {
    deal: ['deal:created', 'deal:updated', 'deal:stage_changed', 'deal:won', 'deal:lost'],
    contact: ['contact:created', 'contact:updated'],
    lead: ['lead:created', 'lead:converted'],
    ticket: ['ticket:created', 'ticket:status_changed'],
    task: ['task:created', 'task:completed'],
    call: ['call:status_changed'],
  };

  return useCRMEvents(onEvent, {
    ...options,
    eventTypes: eventTypeMap[entityType],
  });
}
