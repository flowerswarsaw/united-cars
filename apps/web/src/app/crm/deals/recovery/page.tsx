'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClaimDealModal } from '@/components/crm/ClaimDealModal';
import { DealHistoryDrawer } from '@/components/crm/DealHistoryDrawer';
import toast from 'react-hot-toast';
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Deal, LossReason, DealStatus } from '@united-cars/crm-core';
import { formatCurrency } from '@/lib/utils';

type SortField = 'title' | 'status' | 'amount' | 'date' | 'daysInStatus';
type SortDirection = 'asc' | 'desc';

export default function DealRecoveryPage() {
  const { user } = useSession();
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'lost'>('all');
  const [lossReasonFilter, setLossReasonFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);

      // Load both unassigned and lost deals in parallel
      const [unassignedRes, lostRes] = await Promise.all([
        fetch('/api/crm/deals/unassigned'),
        fetch('/api/crm/deals/lost')
      ]);

      if (!unassignedRes.ok || !lostRes.ok) {
        throw new Error('Failed to load deals');
      }

      const unassignedData = await unassignedRes.json();
      const lostData = await lostRes.json();

      // Merge both datasets
      const merged = [
        ...(unassignedData.data || []),
        ...(lostData.data || [])
      ];

      setAllDeals(merged);
    } catch (error) {
      console.error('Failed to load deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setClaimModalOpen(true);
  };

  const handleViewDeal = (dealId: string) => {
    setSelectedDealId(dealId);
    setHistoryDrawerOpen(true);
  };

  const handleClaimSuccess = () => {
    // Reload deals after successful claim
    loadDeals();
  };

  // Helper functions
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLossReasonLabel = (reason: LossReason | undefined) => {
    if (!reason) return '-';
    const labels: Record<LossReason, string> = {
      STOPPED_WORKING: 'Stopped Working',
      COULD_NOT_REACH_DM: 'Could Not Reach',
      REJECTION: 'Rejection',
      OTHER: 'Other'
    };
    return labels[reason] || reason;
  };

  const getDealStatus = (deal: Deal): 'unassigned' | 'lost' => {
    if (deal.status === DealStatus.LOST) return 'lost';
    if (!deal.responsibleUserId) return 'unassigned';
    return 'unassigned'; // Default
  };

  const getDaysInStatus = (deal: Deal): number => {
    const statusDate = deal.status === DealStatus.LOST && deal.closeDate
      ? new Date(deal.closeDate)
      : deal.unassignedAt
        ? new Date(deal.unassignedAt)
        : new Date();

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - statusDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getLastPipeline = (deal: Deal): string => {
    if (deal.currentStages && deal.currentStages.length > 0) {
      // Get the most recent current stage
      return deal.currentStages[0].pipelineId;
    }
    if (deal.stageHistory && deal.stageHistory.length > 0) {
      // Get the most recent from history
      const sorted = [...deal.stageHistory].sort((a, b) =>
        new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
      );
      return sorted[0].pipelineId;
    }
    return '-';
  };

  const getLastStage = (deal: Deal): string => {
    if (deal.currentStages && deal.currentStages.length > 0) {
      return deal.currentStages[0].stageId;
    }
    if (deal.stageHistory && deal.stageHistory.length > 0) {
      const sorted = [...deal.stageHistory].sort((a, b) =>
        new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
      );
      return sorted[0].toStageId;
    }
    return '-';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = allDeals.filter(deal => {
      // Search filter
      if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const dealStatus = getDealStatus(deal);
        if (statusFilter !== dealStatus) return false;
      }

      // Loss reason filter
      if (lossReasonFilter !== 'all' && deal.lossReason !== lossReasonFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = getDealStatus(a);
          bVal = getDealStatus(b);
          break;
        case 'amount':
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        case 'date':
          aVal = (a.status === DealStatus.LOST && a.closeDate ? new Date(a.closeDate) : a.unassignedAt ? new Date(a.unassignedAt) : new Date(0)).getTime();
          bVal = (b.status === DealStatus.LOST && b.closeDate ? new Date(b.closeDate) : b.unassignedAt ? new Date(b.unassignedAt) : new Date(0)).getTime();
          break;
        case 'daysInStatus':
          aVal = getDaysInStatus(a);
          bVal = getDaysInStatus(b);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allDeals, searchQuery, statusFilter, lossReasonFilter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Recovery"
        description="Claim unassigned or lost deals and assign them to your pipeline"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Deals', href: '/crm/deals' },
          { label: 'Recovery' }
        ]}
      />
      <div className="container mx-auto py-6 px-4">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'unassigned' | 'lost')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unassigned">Unassigned Only</SelectItem>
              <SelectItem value="lost">Lost Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lossReasonFilter} onValueChange={setLossReasonFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="STOPPED_WORKING">Stopped Working</SelectItem>
              <SelectItem value="COULD_NOT_REACH_DM">Could Not Reach</SelectItem>
              <SelectItem value="REJECTION">Rejection</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredAndSortedDeals.length} recoverable deal{filteredAndSortedDeals.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredAndSortedDeals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No recoverable deals found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Deal Title
                      <SortIcon field="title" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </TableHead>
                  <TableHead>Loss Reason</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('daysInStatus')}
                  >
                    <div className="flex items-center">
                      Days
                      <SortIcon field="daysInStatus" />
                    </div>
                  </TableHead>
                  <TableHead>Last Pipeline</TableHead>
                  <TableHead>Last Stage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDeals.map(deal => {
                  const dealStatus = getDealStatus(deal);
                  const statusDate = deal.status === DealStatus.LOST && deal.closeDate
                    ? deal.closeDate
                    : deal.unassignedAt;

                  return (
                    <TableRow key={deal.id} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          onClick={() => handleViewDeal(deal.id)}
                          className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {deal.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dealStatus === 'lost' ? 'destructive' : 'secondary'}>
                          {dealStatus === 'lost' ? 'Lost' : 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deal.amount
                          ? formatCurrency(deal.amount, deal.currency)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(statusDate)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getLossReasonLabel(deal.lossReason)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getDaysInStatus(deal)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getLastPipeline(deal)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getLastStage(deal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleClaimDeal(deal)}
                        >
                          Claim
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Claim Deal Modal */}
      <ClaimDealModal
        deal={selectedDeal}
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={handleClaimSuccess}
      />

      {/* Deal History Drawer */}
      <DealHistoryDrawer
        dealId={selectedDealId}
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      />
    </AppLayout>
  );
}
