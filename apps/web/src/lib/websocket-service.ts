/**
 * WebSocket Service for Real-time Features
 * 
 * Provides real-time communication capabilities for the CRM system
 * Handles live updates, notifications, and collaborative features
 */

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  userId?: string
  organizationId?: string
}

export interface RealTimeEvent {
  type: 'ENTITY_CREATED' | 'ENTITY_UPDATED' | 'ENTITY_DELETED' | 'ENTITY_MOVED' | 'USER_ACTIVITY' | 'NOTIFICATION'
  entityType?: 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Task' | 'Pipeline'
  entityId?: string
  entityName?: string
  data: any
  userId: string
  userName: string
  organizationId: string
  timestamp: Date
}

export type WebSocketEventListener = (event: RealTimeEvent) => void
export type WebSocketStatusListener = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void

/**
 * WebSocket Service Class
 * Manages real-time connections and event handling
 */
export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private eventListeners = new Map<string, Set<WebSocketEventListener>>()
  private statusListeners = new Set<WebSocketStatusListener>()
  private isConnecting = false
  private shouldReconnect = true
  private url: string
  private token?: string

  constructor(url?: string) {
    this.url = url || (typeof window !== 'undefined' ? 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws` : 
      'ws://localhost:3000/api/ws'
    )
  }

  /**
   * Connect to WebSocket server
   */
  async connect(token?: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.token = token
    this.isConnecting = true
    this.notifyStatusListeners('connecting')

    try {
      const wsUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

    } catch (error) {
      this.isConnecting = false
      this.notifyStatusListeners('error')
      
      // Don't attempt reconnection if WebSocket server is not implemented
      this.shouldReconnect = false
      
      // Re-throw the error so calling code can handle it gracefully
      throw error
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false
    this.clearHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.notifyStatusListeners('disconnected')
  }

  /**
   * Send message to server
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message:', message)
      return false
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date()
    }

    try {
      this.ws.send(JSON.stringify(fullMessage))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  /**
   * Subscribe to specific event types
   */
  on(eventType: string, listener: WebSocketEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    
    this.eventListeners.get(eventType)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(listener)
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onStatus(listener: WebSocketStatusListener): () => void {
    this.statusListeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting'
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected'
    if (this.ws?.readyState === WebSocket.CLOSED) return 'disconnected'
    return 'error'
  }

  /**
   * Emit real-time event
   */
  emit(event: Omit<RealTimeEvent, 'timestamp'>): boolean {
    const fullEvent: RealTimeEvent = {
      ...event,
      timestamp: new Date()
    }

    return this.send({
      type: 'REAL_TIME_EVENT',
      payload: fullEvent
    })
  }

  // Private methods
  private handleOpen(): void {
    console.log('WebSocket connected')
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.notifyStatusListeners('connected')
    this.startHeartbeat()

    // Send authentication if token is available
    if (this.token) {
      this.send({
        type: 'AUTH',
        payload: { token: this.token }
      })
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      this.processMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason)
    this.isConnecting = false
    this.clearHeartbeat()
    
    if (event.code !== 1000 && this.shouldReconnect) { // 1000 = normal closure
      this.notifyStatusListeners('disconnected')
      this.scheduleReconnect()
    } else {
      this.notifyStatusListeners('disconnected')
    }
  }

  private handleError(error: Event): void {
    // Only log WebSocket errors in development mode and when verbose logging is enabled
    if (process.env.NODE_ENV === 'development' && process.env.WEBSOCKET_VERBOSE === 'true') {
      console.warn('WebSocket connection unavailable - real-time features disabled:', error)
    }
    this.isConnecting = false
    this.notifyStatusListeners('error')
    
    // Don't attempt reconnection if WebSocket server is not implemented
    this.shouldReconnect = false
  }

  private processMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'REAL_TIME_EVENT':
        this.notifyEventListeners(message.payload.type, message.payload)
        break
      
      case 'HEARTBEAT_RESPONSE':
        // Heartbeat acknowledged
        break
      
      case 'AUTH_SUCCESS':
        console.log('WebSocket authentication successful')
        break
      
      case 'AUTH_FAILED':
        console.error('WebSocket authentication failed')
        this.disconnect()
        break
      
      default:
        console.log('Received WebSocket message:', message)
        this.notifyEventListeners(message.type, message.payload)
    }
  }

  private notifyEventListeners(eventType: string, event: RealTimeEvent): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in WebSocket event listener:', error)
        }
      })
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.eventListeners.get('*')
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in WebSocket wildcard listener:', error)
        }
      })
    }
  }

  private notifyStatusListeners(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Error in WebSocket status listener:', error)
      }
    })
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.shouldReconnect) {
      console.error('Max reconnect attempts reached, giving up')
      return
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.shouldReconnect && this.ws?.readyState !== WebSocket.OPEN) {
        this.connect(this.token)
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.clearHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'HEARTBEAT',
          payload: { timestamp: Date.now() }
        })
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// Singleton instance for global use
let globalWebSocketService: WebSocketService | null = null

/**
 * Get or create global WebSocket service instance
 */
export function getWebSocketService(): WebSocketService {
  if (!globalWebSocketService) {
    globalWebSocketService = new WebSocketService()
  }
  return globalWebSocketService
}

/**
 * Reset global WebSocket service (useful for testing)
 */
export function resetWebSocketService(): void {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect()
    globalWebSocketService = null
  }
}