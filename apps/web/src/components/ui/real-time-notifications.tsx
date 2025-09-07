'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, Users, Activity } from 'lucide-react'
import { useRealTimeNotifications, useRealTimeActivity, useRealTime } from '@/hooks/useRealTime'
import { formatDistanceToNow } from 'date-fns'

export function RealTimeNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, clearNotifications, markAsRead } = useRealTimeNotifications()
  const { activeUsers } = useRealTimeActivity()
  const { isConnected, status } = useRealTime()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-orange-600 bg-orange-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Real-time Updates</CardTitle>
              <div className="flex items-center space-x-2">
                {/* Connection Status */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-text-secondary">
                    {status === 'connected' ? 'Live' : status}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Active Users */}
            {activeUsers.length > 0 && (
              <div className="px-4 py-2 border-b border-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-medium">Active Users ({activeUsers.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeUsers.slice(0, 8).map(user => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs"
                      title={`${user.userName} - ${user.currentPage || 'Unknown page'} - ${formatDistanceToNow(user.lastActivity)} ago`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="truncate max-w-[4rem]">{user.userName}</span>
                    </div>
                  ))}
                  {activeUsers.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{activeUsers.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No recent updates</p>
                  {!isConnected && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Connect to see real-time updates
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.slice(0, 20).map((notification, index) => {
                    const NotificationIcon = getNotificationIcon(notification.data?.type || 'info')
                    return (
                      <div
                        key={`${notification.timestamp}-${index}`}
                        className={`p-3 rounded-lg border transition-colors ${
                          notification.data?.read 
                            ? 'bg-background border-border' 
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`rounded-full p-1 ${getNotificationColor(notification.data?.type || 'info')}`}>
                            <NotificationIcon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.data?.message || notification.type}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-text-tertiary">
                                {notification.userName} • {formatDistanceToNow(new Date(notification.timestamp))} ago
                              </span>
                              {!notification.data?.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.data?.id)}
                                  className="h-6 px-2"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearNotifications}
                  className="w-full"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Real-time Status Indicator Component
 */
export function RealTimeStatus() {
  const { isConnected, status } = useRealTime()
  const { activeUsers } = useRealTimeActivity()

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected': return `Live (${activeUsers.length} active)`
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Offline'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-text-tertiary">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span>{getStatusText()}</span>
    </div>
  )
}

/**
 * Real-time Entity Update Badge
 */
export function RealTimeEntityBadge({ 
  entityType, 
  entityId, 
  className = '' 
}: { 
  entityType: string
  entityId?: string
  className?: string 
}) {
  const [showPulse, setShowPulse] = useState(false)
  const { subscribe } = useRealTime()

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    const entityEvents = ['ENTITY_CREATED', 'ENTITY_UPDATED', 'ENTITY_DELETED', 'ENTITY_MOVED']
    
    entityEvents.forEach(eventType => {
      const unsubscribe = subscribe(eventType, (event) => {
        if (event.entityType === entityType && (!entityId || event.entityId === entityId)) {
          setShowPulse(true)
          setTimeout(() => setShowPulse(false), 2000)
        }
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [entityType, entityId, subscribe])

  if (!showPulse) return null

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
      </div>
    </div>
  )
}