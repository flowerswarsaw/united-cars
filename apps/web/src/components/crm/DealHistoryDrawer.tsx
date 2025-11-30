'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, DollarSign, Calendar, User, Building2, Clock } from 'lucide-react';
import { Deal, DealStatus, Activity } from '@united-cars/crm-core';
import { formatCurrency } from '@/lib/utils';

interface DealHistoryDrawerProps {
  dealId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DealHistoryDrawer({ dealId, open, onClose }: DealHistoryDrawerProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dealId && open) {
      loadDealDetails();
    }
  }, [dealId, open]);

  const loadDealDetails = async () => {
    if (!dealId) return;

    try {
      setLoading(true);

      // Load deal
      const dealRes = await fetch(`/api/crm/deals/${dealId}`);
      if (!dealRes.ok) throw new Error('Failed to load deal');
      const dealData = await dealRes.json();
      setDeal(dealData.data);

      // Load activities
      const activitiesRes = await fetch(`/api/crm/activities?entityType=DEAL&entityId=${dealId}`);
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.data || []);
      }
    } catch (error) {
      console.error('Failed to load deal details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDealStatusBadge = (status: DealStatus) => {
    const variants: Record<DealStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [DealStatus.OPEN]: 'default',
      [DealStatus.WON]: 'default',
      [DealStatus.LOST]: 'destructive',
      [DealStatus.INTEGRATION]: 'secondary',
      [DealStatus.CLOSED]: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DEAL_CLAIMED':
        return <User className="h-4 w-4" />;
      case 'DEAL_UNASSIGNED':
        return <User className="h-4 w-4 text-gray-400" />;
      case 'STAGE_MOVED':
        return <Clock className="h-4 w-4" />;
      case 'DEAL_WON':
      case 'DEAL_LOST':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{deal?.title || 'Deal Details'}</SheetTitle>
          <SheetDescription>
            Complete history and details for this deal
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : deal ? (
          <div className="mt-6 space-y-6">
            {/* Deal Overview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Overview</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  {getDealStatusBadge(deal.status)}
                </div>
                {deal.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(deal.amount, deal.currency)}
                    </span>
                  </div>
                )}
                {deal.probability !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Probability</span>
                    <span className="text-sm font-medium">{deal.probability}%</span>
                  </div>
                )}
                {deal.responsibleUserId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Responsible User</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {deal.responsibleUserId}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-700">{formatDate(deal.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-700">{formatDate(deal.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Lost/Unassigned Info */}
            {(deal.status === DealStatus.LOST || deal.unassignedAt) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {deal.status === DealStatus.LOST ? 'Loss Details' : 'Unassignment Details'}
                  </h3>
                  <div className="space-y-3 bg-red-50 p-4 rounded-lg">
                    {deal.lossReason && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reason</span>
                        <span className="text-sm font-medium text-red-700">{deal.lossReason}</span>
                      </div>
                    )}
                    {deal.unassignedReason && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unassignment Reason</span>
                        <span className="text-sm font-medium text-gray-700">{deal.unassignedReason}</span>
                      </div>
                    )}
                    {deal.closeDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Closed Date</span>
                        <span className="text-sm text-gray-700">{formatDate(deal.closeDate)}</span>
                      </div>
                    )}
                    {deal.unassignedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unassigned At</span>
                        <span className="text-sm text-gray-700">{formatDate(deal.unassignedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Stage History */}
            {deal.stageHistory && deal.stageHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage History</h3>
                  <div className="space-y-2">
                    {[...deal.stageHistory]
                      .sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime())
                      .map((history, index) => (
                        <div key={history.id} className="flex items-start gap-3 text-sm">
                          <div className="mt-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900">
                              Moved to stage <strong>{history.toStageId}</strong>
                              {history.fromStageId && ` from ${history.fromStageId}`}
                            </p>
                            {history.note && (
                              <p className="text-gray-600 mt-1 italic">"{history.note}"</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">{formatDate(history.movedAt)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Activity Timeline */}
            {activities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Timeline</h3>
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          {activity.meta && Object.keys(activity.meta).length > 0 && (
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer hover:text-gray-900">
                                View details
                              </summary>
                              <pre className="mt-2 rounded bg-gray-50 p-2 overflow-x-auto">
                                {JSON.stringify(activity.meta, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {deal.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No deal data available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
