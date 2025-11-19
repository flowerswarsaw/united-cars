"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity as ActivityIcon,
  Filter,
  RefreshCw,
  Calendar,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash2,
  Move,
  Target,
  Users,
  Building
} from 'lucide-react';
import { Activity, ActivityType, EntityType } from '@united-cars/crm-core';

interface ActivityLogProps {
  entityType?: EntityType;
  entityId?: string;
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  className?: string;
}

interface ActivityResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function ActivityLog({
  entityType,
  entityId,
  limit = 20,
  showFilters = true,
  showPagination = true,
  className = ""
}: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchActivities = async (page = 1, type = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (entityType && entityId) {
        params.set('entityType', entityType);
        params.set('entityId', entityId);
      }

      if (type && type !== 'all') {
        params.set('type', type);
      }

      const response = await fetch(`/api/crm/activities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activities');

      const data: ActivityResponse = await response.json();
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId, limit, refreshKey]);

  const handleFilterChange = (value: string) => {
    setTypeFilter(value);
    fetchActivities(1, value);
  };

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage);
  };

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CREATED:
        return <Plus className="h-4 w-4 text-green-600" />;
      case ActivityType.UPDATED:
        return <Edit className="h-4 w-4 text-blue-600" />;
      case ActivityType.DELETED:
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case ActivityType.STAGE_MOVED:
        return <Move className="h-4 w-4 text-purple-600" />;
      case ActivityType.DEAL_WON:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ActivityType.DEAL_LOST:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case ActivityType.LEAD_CONVERTED:
        return <Target className="h-4 w-4 text-orange-600" />;
      case ActivityType.TASK_COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ActivityType.NOTE_ADDED:
        return <FileText className="h-4 w-4 text-gray-600" />;
      case ActivityType.CONTACT_ASSIGNED:
        return <Users className="h-4 w-4 text-blue-600" />;
      case ActivityType.ORGANIZATION_ASSIGNED:
        return <Building className="h-4 w-4 text-blue-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CREATED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ActivityType.UPDATED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ActivityType.DELETED:
        return 'bg-red-100 text-red-800 border-red-200';
      case ActivityType.STAGE_MOVED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ActivityType.DEAL_WON:
        return 'bg-green-100 text-green-800 border-green-200';
      case ActivityType.DEAL_LOST:
        return 'bg-red-100 text-red-800 border-red-200';
      case ActivityType.LEAD_CONVERTED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatActivityType = (type: ActivityType) => {
    return type.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: ActivityType.CREATED, label: 'Created' },
    { value: ActivityType.UPDATED, label: 'Updated' },
    { value: ActivityType.STAGE_MOVED, label: 'Stage Moved' },
    { value: ActivityType.DEAL_WON, label: 'Deal Won' },
    { value: ActivityType.DEAL_LOST, label: 'Deal Lost' },
    { value: ActivityType.NOTE_ADDED, label: 'Note Added' },
    { value: ActivityType.CONTACT_ASSIGNED, label: 'Contact Assigned' },
    { value: ActivityType.ORGANIZATION_ASSIGNED, label: 'Organization Assigned' }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Activity Log</CardTitle>
            {pagination.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pagination.total} activities
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Select value={typeFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No activities found</p>
            {typeFilter !== 'all' && (
              <Button
                variant="link"
                size="sm"
                onClick={() => handleFilterChange('all')}
                className="mt-2"
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id} className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getActivityColor(activity.type)}`}
                          >
                            {formatActivityType(activity.type)}
                          </Badge>

                          {activity.userId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>
                                {activity.userId === 'system'
                                  ? 'System'
                                  : activity.userId.includes('@')
                                    ? activity.userId.split('@')[0]
                                    : activity.userId.replace('user-', '').replace('-', ' ')
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        {activity.meta && Object.keys(activity.meta).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {Object.entries(activity.meta).map(([key, value]) => {
                              // Skip empty values
                              if (!value || value === 'Unknown Stage' || value === 'Unknown Pipeline') return null;

                              // Format key names nicely
                              const formatKey = (k: string) => {
                                return k.replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, str => str.toUpperCase())
                                  .replace(/Id$/, ' ID');
                              };

                              // Skip redundant fields if we have names
                              if ((key === 'fromStageId' && activity.meta?.fromStageName) ||
                                  (key === 'toStageId' && activity.meta?.toStageName) ||
                                  (key === 'pipelineId' && activity.meta?.pipelineName)) {
                                return null;
                              }

                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="font-medium text-muted-foreground/80">{formatKey(key)}:</span>
                                  <span className="text-foreground/90">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {index < activities.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}

        {showPagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}