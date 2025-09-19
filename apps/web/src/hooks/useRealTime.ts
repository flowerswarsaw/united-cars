import { useState, useEffect, useCallback, useRef } from 'react'
import { getWebSocketService, RealTimeEvent, WebSocketEventListener, WebSocketStatusListener } from '@/lib/websocket-service'
import { useAuth } from '@/contexts/auth-context'

export interface UseRealTimeOptions {
  autoConnect?: boolean
  eventTypes?: string[]
  organizationFilter?: boolean
}

export interface UseRealTimeResult {
  isConnected: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastEvent: RealTimeEvent | null
  connect: () => Promise<void>
  disconnect: () => void
  emit: (event: Omit<RealTimeEvent, 'timestamp'>) => boolean
  subscribe: (eventType: string, listener: WebSocketEventListener) => () => void
}

/**
 * Hook for real-time WebSocket communication
 */
export function useRealTime(options: UseRealTimeOptions = {}): UseRealTimeResult {
  const { autoConnect = true, eventTypes, organizationFilter = true } = options
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null)
  const { user, isAuthenticated } = useAuth()
  const wsService = useRef(getWebSocketService())
  const listenersRef = useRef<Set<() => void>>(new Set())

  const isConnected = status === 'connected'

  const connect = useCallback(async () => {
    try {
      if (isAuthenticated && user) {
        // In a real implementation, we would get a WebSocket token from the auth service
        const token = `user_${user.id}_${Date.now()}`
        await wsService.current.connect(token)
      } else {
        await wsService.current.connect()
      }
    } catch (error) {
      // Silently handle connection failures when WebSocket server is not available
      // Real-time features will be disabled but the app continues to function
      if (process.env.NODE_ENV === 'development' && process.env.WEBSOCKET_VERBOSE === 'true') {
        console.warn('WebSocket connection failed - real-time features disabled')
      }
    }
  }, [isAuthenticated, user])

  const disconnect = useCallback(() => {
    wsService.current.disconnect()
  }, [])

  const emit = useCallback((event: Omit<RealTimeEvent, 'timestamp'>) => {
    if (!user) return false
    
    const fullEvent = {
      ...event,
      userId: user.id,
      userName: user.name || user.email,
      organizationId: user.orgId
    }
    
    return wsService.current.emit(fullEvent)
  }, [user])

  const subscribe = useCallback((eventType: string, listener: WebSocketEventListener) => {
    const wrappedListener: WebSocketEventListener = (event) => {
      // Apply organization filter if enabled
      if (organizationFilter && user && event.organizationId && event.organizationId !== user.orgId) {
        return // Skip events from other organizations
      }
      
      listener(event)
    }

    const unsubscribe = wsService.current.on(eventType, wrappedListener)
    listenersRef.current.add(unsubscribe)
    
    return () => {
      unsubscribe()
      listenersRef.current.delete(unsubscribe)
    }
  }, [organizationFilter, user])

  // Set up status listener
  useEffect(() => {
    const unsubscribeStatus = wsService.current.onStatus(setStatus)
    
    return () => {
      unsubscribeStatus()
    }
  }, [])

  // Set up event listeners for specified event types
  useEffect(() => {
    if (!eventTypes) return

    const unsubscribers: (() => void)[] = []

    eventTypes.forEach(eventType => {
      const unsubscribe = subscribe(eventType, (event) => {
        setLastEvent(event)
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [eventTypes, subscribe])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && status === 'disconnected') {
      connect()
    }
  }, [autoConnect, isAuthenticated, status, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe())
      listenersRef.current.clear()
    }
  }, [])

  return {
    isConnected,
    status,
    lastEvent,
    connect,
    disconnect,
    emit,
    subscribe
  }
}

/**
 * Hook for real-time entity updates
 */
export function useRealTimeEntity(entityType: string, entityId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const { subscribe, emit } = useRealTime()

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    // Subscribe to entity-specific events
    const entityEvents = ['ENTITY_CREATED', 'ENTITY_UPDATED', 'ENTITY_DELETED', 'ENTITY_MOVED']
    
    entityEvents.forEach(eventType => {
      const unsubscribe = subscribe(eventType, (event) => {
        // Filter by entity type and optionally by entity ID
        if (event.entityType === entityType && (!entityId || event.entityId === entityId)) {
          setLastUpdate(new Date())
          setUpdateCount(prev => prev + 1)
        }
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [entityType, entityId, subscribe])

  const emitEntityEvent = useCallback((
    type: 'ENTITY_CREATED' | 'ENTITY_UPDATED' | 'ENTITY_DELETED' | 'ENTITY_MOVED',
    entityName: string,
    data: any,
    targetEntityId?: string
  ) => {
    return emit({
      type,
      entityType: entityType as any,
      entityId: targetEntityId || entityId,
      entityName,
      data
    })
  }, [emit, entityType, entityId])

  return {
    lastUpdate,
    updateCount,
    emitEntityEvent
  }
}

/**
 * Hook for real-time notifications
 */
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<RealTimeEvent[]>([])
  const { subscribe, emit } = useRealTime()

  useEffect(() => {
    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      setNotifications(prev => [event, ...prev].slice(0, 50)) // Keep last 50 notifications
    })

    return unsubscribe
  }, [subscribe])

  const sendNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', targetUserId?: string) => {
    return emit({
      type: 'NOTIFICATION',
      data: {
        message,
        type,
        targetUserId
      }
    })
  }, [emit])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.data?.id === notificationId 
          ? { ...notification, data: { ...notification.data, read: true } }
          : notification
      )
    )
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.data?.read).length,
    sendNotification,
    clearNotifications,
    markAsRead
  }
}

/**
 * Hook for real-time user activity tracking
 */
export function useRealTimeActivity() {
  const [activeUsers, setActiveUsers] = useState<Array<{
    userId: string
    userName: string
    lastActivity: Date
    currentPage?: string
  }>>([])
  
  const { subscribe, emit } = useRealTime()

  useEffect(() => {
    const unsubscribe = subscribe('USER_ACTIVITY', (event) => {
      setActiveUsers(prev => {
        const filtered = prev.filter(user => user.userId !== event.userId)
        return [{
          userId: event.userId,
          userName: event.userName,
          lastActivity: new Date(event.timestamp),
          currentPage: event.data?.page
        }, ...filtered].slice(0, 20) // Keep last 20 active users
      })
    })

    return unsubscribe
  }, [subscribe])

  const reportActivity = useCallback((page: string, action?: string) => {
    return emit({
      type: 'USER_ACTIVITY',
      data: {
        page,
        action
      }
    })
  }, [emit])

  // Clean up inactive users (older than 5 minutes)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      setActiveUsers(prev => prev.filter(user => user.lastActivity > fiveMinutesAgo))
    }, 60000) // Clean up every minute

    return () => clearInterval(cleanup)
  }, [])

  return {
    activeUsers,
    reportActivity
  }
}