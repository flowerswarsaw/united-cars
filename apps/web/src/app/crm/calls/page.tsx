"use client";

import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  CheckCircle2,
  XCircle,
  PhoneMissed,
  User,
  Building2,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Call {
  id: string;
  tenantId: string;
  crmUserId: string;
  contactId?: string;
  organisationId?: string;
  dealId?: string;
  direction: 'OUTBOUND' | 'INBOUND';
  status: 'QUEUED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'BUSY' | 'CANCELLED';
  phoneNumber: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  provider: string;
  providerCallId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

const StatusIcons = {
  'QUEUED': Clock,
  'RINGING': Phone,
  'IN_PROGRESS': Phone,
  'COMPLETED': CheckCircle2,
  'FAILED': XCircle,
  'NO_ANSWER': PhoneMissed,
  'BUSY': PhoneMissed,
  'CANCELLED': XCircle,
};

const StatusColors = {
  'QUEUED': 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  'RINGING': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  'IN_PROGRESS': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300',
  'COMPLETED': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300',
  'FAILED': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
  'NO_ANSWER': 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
  'BUSY': 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
  'CANCELLED': 'text-slate-600 bg-slate-100 dark:bg-slate-900 dark:text-slate-300',
};

interface CallFilters {
  status: string;
  direction: string;
}

export default function CallsPage() {
  const { user } = useSession();
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CallFilters>({
    status: 'all',
    direction: 'all',
  });

  const loadCalls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/calls');
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      } else {
        toast.error('Failed to load calls');
      }
    } catch (error) {
      console.error('Failed to load calls:', error);
      toast.error('Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // Filter calls based on selected filters
  useEffect(() => {
    let result = [...calls];

    if (filters.status !== 'all') {
      result = result.filter(call => call.status === filters.status);
    }

    if (filters.direction !== 'all') {
      result = result.filter(call => call.direction === filters.direction);
    }

    setFilteredCalls(result);
  }, [calls, filters]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Please log in to view calls</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Call History"
          description="View and manage all call logs"
        >
          <div className="flex items-center gap-3">
            <Select
              value={filters.direction}
              onValueChange={(value) => setFilters(prev => ({ ...prev, direction: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                <SelectItem value="BUSY">Busy</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PageHeader>

        {loading ? (
          <LoadingState message="Loading calls..." />
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No calls found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.status !== 'all' || filters.direction !== 'all'
                ? 'Try adjusting your filters'
                : 'Start making calls to see them here'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Date/Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => {
                  const StatusIcon = StatusIcons[call.status];
                  const DirectionIcon = call.direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;

                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DirectionIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm capitalize">
                            {call.direction.toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${call.phoneNumber}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {call.phoneNumber}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${StatusColors[call.status]} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {call.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDuration(call.durationSec)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {call.user?.name || call.user?.email || call.crmUserId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {call.contactId && (
                            <Link
                              href={`/crm/contacts/${call.contactId}`}
                              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <User className="h-3 w-3" />
                              Contact
                            </Link>
                          )}
                          {call.organisationId && (
                            <Link
                              href={`/crm/organisations/${call.organisationId}`}
                              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Building2 className="h-3 w-3" />
                              Organisation
                            </Link>
                          )}
                          {call.dealId && (
                            <Link
                              href={`/crm/deals/${call.dealId}`}
                              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <TrendingUp className="h-3 w-3" />
                              Deal
                            </Link>
                          )}
                          {!call.contactId && !call.organisationId && !call.dealId && (
                            <span className="text-sm text-gray-400">--</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(call.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && filteredCalls.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Showing {filteredCalls.length} of {calls.length} calls
          </div>
        )}
      </div>
    </AppLayout>
  );
}
