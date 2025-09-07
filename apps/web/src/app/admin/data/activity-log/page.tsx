'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Clock, 
  User, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Building2,
  UserCheck,
  HandCoins,
  Target,
  CheckSquare,
  GitBranch,
  Plus,
  Minus,
  Edit,
  Trash2,
  ArrowRight,
  Calendar,
  Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useActivityLog, ActivityFilter } from '@/hooks/useActivityLog'

interface ActivityLogEntry {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'CONVERT' | 'ASSIGN'
  entityType: 'Organisation' | 'Contact' | 'Deal' | 'Lead' | 'Task' | 'Pipeline' | 'Stage'
  entityId: string
  entityName: string
  userId: string
  userName: string
  userRole: string
  timestamp: Date
  description: string
  details?: Record<string, any>
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  metadata?: {
    ip?: string
    userAgent?: string
    organizationId?: string
    source?: 'web' | 'api' | 'system'
  }
}

interface ActivityStats {
  totalActivities: number
  todayActivities: number
  weekActivities: number
  topUsers: Array<{
    userId: string
    userName: string
    count: number
  }>
  topEntities: Array<{
    entityType: string
    count: number
  }>
}

export default function ActivityLogPage() {
  const [activeTab, setActiveTab] = useState('timeline')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all')
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7days')
  const { user } = useAuth()
  const { 
    activities, 
    stats, 
    isLoading, 
    error, 
    loadActivities, 
    loadStats, 
    exportActivities 
  } = useActivityLog()

  // Mock data for development
  const mockActivities: ActivityLogEntry[] = [
    {
      id: 'act-1',
      type: 'CREATE',
      entityType: 'Contact',
      entityId: 'contact-1',
      entityName: 'John Smith',
      userId: 'user-1',
      userName: 'System Administrator',
      userRole: 'admin',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      description: 'Created new contact "John Smith" for Acme Corporation',
      details: {
        contactInfo: {
          email: 'john.smith@acme.com',
          phone: '+1 (555) 123-4567',
          title: 'Operations Manager'
        }
      },
      metadata: {
        organizationId: 'org-1',
        source: 'web',
        ip: '192.168.1.100'
      }
    },
    {
      id: 'act-2',
      type: 'UPDATE',
      entityType: 'Deal',
      entityId: 'deal-1',
      entityName: 'Q4 Expansion Deal',
      userId: 'user-2',
      userName: 'Sales Manager',
      userRole: 'sales_manager',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      description: 'Updated deal value from $45,000 to $52,000',
      changes: [
        { field: 'value', oldValue: 45000, newValue: 52000 },
        { field: 'notes', oldValue: 'Initial quote', newValue: 'Updated after negotiation' }
      ],
      metadata: {
        organizationId: 'org-1',
        source: 'web'
      }
    },
    {
      id: 'act-3',
      type: 'MOVE',
      entityType: 'Deal',
      entityId: 'deal-2',
      entityName: 'Integration Services Deal',
      userId: 'user-2',
      userName: 'Sales Manager',
      userRole: 'sales_manager',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      description: 'Moved deal from "Proposal" to "Negotiation" stage',
      details: {
        fromStage: 'Proposal',
        toStage: 'Negotiation',
        pipelineName: 'Dealer Acquisition'
      },
      metadata: {
        organizationId: 'org-1',
        source: 'web'
      }
    },
    {
      id: 'act-4',
      type: 'CONVERT',
      entityType: 'Lead',
      entityId: 'lead-1',
      entityName: 'Premium Auto Group',
      userId: 'user-3',
      userName: 'CRM User',
      userRole: 'crm_user',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      description: 'Converted lead "Premium Auto Group" to deal',
      details: {
        createdDealId: 'deal-3',
        dealValue: 75000,
        pipeline: 'Dealer Acquisition'
      },
      metadata: {
        organizationId: 'org-1',
        source: 'web'
      }
    },
    {
      id: 'act-5',
      type: 'CREATE',
      entityType: 'Organisation',
      entityId: 'org-2',
      entityName: 'Elite Auto Dealers',
      userId: 'user-1',
      userName: 'System Administrator',
      userRole: 'admin',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      description: 'Created new organization "Elite Auto Dealers"',
      details: {
        organizationType: 'DEALER',
        industry: 'Automotive',
        size: 'MEDIUM'
      },
      metadata: {
        organizationId: 'org-admin',
        source: 'web'
      }
    },
    {
      id: 'act-6',
      type: 'ASSIGN',
      entityType: 'Task',
      entityId: 'task-1',
      entityName: 'Follow up on proposal',
      userId: 'user-2',
      userName: 'Sales Manager',
      userRole: 'sales_manager',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      description: 'Assigned task "Follow up on proposal" to John Doe',
      details: {
        assignedTo: 'John Doe',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        priority: 'HIGH'
      },
      metadata: {
        organizationId: 'org-1',
        source: 'web'
      }
    }
  ]

  const mockStats: ActivityStats = {
    totalActivities: 247,
    todayActivities: 18,
    weekActivities: 89,
    topUsers: [
      { userId: 'user-1', userName: 'System Administrator', count: 45 },
      { userId: 'user-2', userName: 'Sales Manager', count: 38 },
      { userId: 'user-3', userName: 'CRM User', count: 24 }
    ],
    topEntities: [
      { entityType: 'Contact', count: 78 },
      { entityType: 'Deal', count: 56 },
      { entityType: 'Organisation', count: 42 },
      { entityType: 'Task', count: 35 }
    ]
  }

  useEffect(() => {
    // Load initial data
    loadActivities({ dateRange })
    loadStats()
  }, [])

  useEffect(() => {
    // Reload activities when filters change
    const filter: ActivityFilter = {}
    
    if (searchTerm) filter.search = searchTerm
    if (selectedEntityType !== 'all') filter.entityType = selectedEntityType
    if (selectedActivityType !== 'all') filter.activityType = selectedActivityType
    if (selectedUser !== 'all') filter.userId = selectedUser
    if (dateRange !== 'all') filter.dateRange = dateRange

    loadActivities(filter)
  }, [searchTerm, selectedEntityType, selectedActivityType, selectedUser, dateRange])

  const getActivityIcon = (type: string, entityType: string) => {
    switch (type) {
      case 'CREATE': return Plus
      case 'UPDATE': return Edit
      case 'DELETE': return Trash2
      case 'MOVE': return ArrowRight
      case 'CONVERT': return GitBranch
      case 'ASSIGN': return UserCheck
      default: return Activity
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Organisation': return Building2
      case 'Contact': return UserCheck
      case 'Deal': return HandCoins
      case 'Lead': return Target
      case 'Task': return CheckSquare
      case 'Pipeline': return GitBranch
      default: return Activity
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE': return 'text-green-600 bg-green-50'
      case 'UPDATE': return 'text-blue-600 bg-blue-50'
      case 'DELETE': return 'text-red-600 bg-red-50'
      case 'MOVE': return 'text-purple-600 bg-purple-50'
      case 'CONVERT': return 'text-orange-600 bg-orange-50'
      case 'ASSIGN': return 'text-indigo-600 bg-indigo-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const refreshActivities = async () => {
    const filter: ActivityFilter = {}
    if (searchTerm) filter.search = searchTerm
    if (selectedEntityType !== 'all') filter.entityType = selectedEntityType
    if (selectedActivityType !== 'all') filter.activityType = selectedActivityType
    if (selectedUser !== 'all') filter.userId = selectedUser
    if (dateRange !== 'all') filter.dateRange = dateRange
    
    await loadActivities(filter)
    await loadStats()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
        <p className="text-text-secondary mt-2">
          Monitor all system activities with comprehensive audit trail and visual timeline
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Activity Filters</span>
                <Button 
                  onClick={refreshActivities} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="Organisation">Organizations</SelectItem>
                    <SelectItem value="Contact">Contacts</SelectItem>
                    <SelectItem value="Deal">Deals</SelectItem>
                    <SelectItem value="Lead">Leads</SelectItem>
                    <SelectItem value="Task">Tasks</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Activities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="MOVE">Move</SelectItem>
                    <SelectItem value="CONVERT">Convert</SelectItem>
                    <SelectItem value="ASSIGN">Assign</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">Last 24 Hours</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline"
                  onClick={() => {
                    const filter: ActivityFilter = {}
                    if (searchTerm) filter.search = searchTerm
                    if (selectedEntityType !== 'all') filter.entityType = selectedEntityType
                    if (selectedActivityType !== 'all') filter.activityType = selectedActivityType
                    if (selectedUser !== 'all') filter.userId = selectedUser
                    if (dateRange !== 'all') filter.dateRange = dateRange
                    exportActivities(filter)
                  }}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                {activities.length} activities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                  <p className="text-text-secondary">
                    Try adjusting your filters to see more activities
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type, activity.entityType)
                    const EntityIcon = getEntityIcon(activity.entityType)
                    
                    return (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        {/* Timeline connector */}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center ${getActivityTypeColor(activity.type)}`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          {index < activities.length - 1 && (
                            <div className="absolute top-10 left-1/2 transform -translate-x-0.5 w-0.5 h-8 bg-border" />
                          )}
                        </div>

                        {/* Activity details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <EntityIcon className="w-4 h-4 text-text-tertiary" />
                                <span className="font-medium text-foreground">
                                  {activity.entityName}
                                </span>
                                <Badge className={getActivityTypeColor(activity.type)}>
                                  {activity.type}
                                </Badge>
                                <Badge variant="outline">
                                  {activity.entityType}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-text-secondary mb-2">
                                {activity.description}
                              </p>

                              {activity.changes && activity.changes.length > 0 && (
                                <div className="text-xs text-text-tertiary space-y-1 mb-2">
                                  {activity.changes.map((change, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                      <span className="font-medium">{change.field}:</span>
                                      <span className="bg-red-50 text-red-700 px-1 rounded">
                                        {String(change.oldValue)}
                                      </span>
                                      <ArrowRight className="w-3 h-3" />
                                      <span className="bg-green-50 text-green-700 px-1 rounded">
                                        {String(change.newValue)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {activity.userName}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeAgo(activity.timestamp)}
                                </div>
                                {activity.metadata?.source && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.source}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <>
              {/* Activity Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-secondary">Total Activities</p>
                        <p className="text-3xl font-bold">{stats.totalActivities}</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-secondary">Today</p>
                        <p className="text-3xl font-bold text-green-600">{stats.todayActivities}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-secondary">This Week</p>
                        <p className="text-3xl font-bold text-purple-600">{stats.weekActivities}</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-secondary">Avg/Day</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {Math.round(stats.weekActivities / 7)}
                        </p>
                      </div>
                      <RefreshCw className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Users and Entities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Active Users</CardTitle>
                    <CardDescription>Users with the most activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topUsers.map((userStat, index) => (
                        <div key={userStat.userId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <span className="font-medium">{userStat.userName}</span>
                          </div>
                          <Badge variant="outline">{userStat.count} activities</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity by Entity Type</CardTitle>
                    <CardDescription>Distribution of activities across entities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topEntities.map((entityStat, index) => {
                        const EntityIcon = getEntityIcon(entityStat.entityType)
                        return (
                          <div key={entityStat.entityType} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <EntityIcon className="w-5 h-5 text-text-tertiary" />
                              <span className="font-medium">{entityStat.entityType}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${(entityStat.count / Math.max(...stats.topEntities.map(e => e.count))) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-text-secondary min-w-[3rem] text-right">
                                {entityStat.count}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log Settings</CardTitle>
              <CardDescription>Configure activity logging and retention policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Log Retention Period</h4>
                  <Select defaultValue="90days">
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="90days">90 Days (Recommended)</SelectItem>
                      <SelectItem value="180days">180 Days</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Types to Log</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['CREATE', 'UPDATE', 'DELETE', 'MOVE', 'CONVERT', 'ASSIGN'].map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}