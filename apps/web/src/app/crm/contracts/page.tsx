"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  FileText,
  X,
} from 'lucide-react';
import { Contract, ContractStatus, ContractType, Organisation, Deal, Contact } from '@united-cars/crm-core';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { UserSelect } from '@/components/crm/shared/user-select';
import { ContactsMultiSelect } from '@/components/crm/shared/contacts-multi-select';

interface ContractFilters {
  status: string;
  type: string;
}

// Helper function to get status badge variant
const getStatusVariant = (status: ContractStatus): "default" | "secondary" | "success" | "destructive" | "warning" => {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'SENT': return 'default';
    case 'SIGNED': return 'success';
    case 'ACTIVE': return 'success';
    case 'EXPIRED': return 'warning';
    case 'CANCELLED': return 'destructive';
    default: return 'default';
  }
};

export default function ContractsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<ContractFilters>({
    status: '',
    type: ''
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ContractType.SERVICE,
    status: ContractStatus.DRAFT,
    amount: '',
    currency: 'USD',
    effectiveDate: '',
    endDate: '',
    organisationId: '',
    dealId: '',
    contactIds: [] as string[],
    responsibleUserId: '',
    version: '1.0',
    notes: ''
  });

  // Load contracts function
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }

      const url = params.toString()
        ? `/api/crm/contracts?${params.toString()}`
        : '/api/crm/contracts';

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch contracts (${response.status})`);
      }
      const data = await response.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      toast.error('Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [filters.status, filters.type]);

  // Load related data for selectors
  const loadRelatedData = useCallback(async () => {
    try {
      const [orgsRes, dealsRes, contactsRes] = await Promise.all([
        fetch('/api/crm/organisations'),
        fetch('/api/crm/deals'),
        fetch('/api/crm/contacts')
      ]);

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganisations(Array.isArray(data) ? data : []);
      }
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(Array.isArray(data) ? data : []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load related data:', error);
    }
  }, []);

  useEffect(() => {
    loadRelatedData();
  }, [loadRelatedData]);

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearchQuery]);

  // Load contracts when filters change
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.title || !formData.organisationId) {
      toast.error('Please fill in title and select an organisation');
      return;
    }

    try {
      const response = await fetch('/api/crm/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          effectiveDate: formData.effectiveDate || undefined,
          endDate: formData.endDate || undefined,
        })
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setFormData({
          title: '',
          description: '',
          type: ContractType.SERVICE,
          status: ContractStatus.DRAFT,
          amount: '',
          currency: 'USD',
          effectiveDate: '',
          endDate: '',
          organisationId: '',
          dealId: '',
          contactIds: [],
          responsibleUserId: '',
          version: '1.0',
          notes: ''
        });
        loadContracts();
        toast.success(`Contract created: ${formData.title}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create contract');
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
      toast.error('Failed to create contract');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      status: '',
      type: ''
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    (filters.status && filters.status !== 'all') ||
    (filters.type && filters.type !== 'all')
  );

  // Filter contracts by search query (client-side)
  const filteredContracts = contracts.filter(contract => {
    if (!debouncedSearchQuery) return true;
    const query = debouncedSearchQuery.toLowerCase();
    return (
      contract.title.toLowerCase().includes(query) ||
      contract.contractNumber.toLowerCase().includes(query) ||
      (contract.description && contract.description.toLowerCase().includes(query))
    );
  });

  if (sessionLoading || !user || initialLoading) {
    return (
      <AppLayout user={user}>
        <PageHeader
          title="Contracts"
          description="Manage legal agreements and contracts"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Contracts' }]}
        />
        <LoadingState text="Loading contracts..." />
      </AppLayout>
    );
  }

  const newContractButton = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Master Service Agreement"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ContractType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContractType.MASTER}>Master</SelectItem>
                  <SelectItem value={ContractType.ORDER}>Order</SelectItem>
                  <SelectItem value={ContractType.NDA}>NDA</SelectItem>
                  <SelectItem value={ContractType.SERVICE}>Service</SelectItem>
                  <SelectItem value={ContractType.AMENDMENT}>Amendment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ContractStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContractStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={ContractStatus.SENT}>Sent</SelectItem>
                  <SelectItem value={ContractStatus.SIGNED}>Signed</SelectItem>
                  <SelectItem value={ContractStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ContractStatus.EXPIRED}>Expired</SelectItem>
                  <SelectItem value={ContractStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contract description..."
              rows={3}
            />
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Relationships */}
          <div className="space-y-4">
            {/* Organisation Selector */}
            <div>
              <Label>Organisation *</Label>
              <Select
                value={formData.organisationId || undefined}
                onValueChange={(value) => setFormData({
                  ...formData,
                  organisationId: value,
                  contactIds: [] // Clear contacts when org changes
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organisations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contacts Multi-Selector */}
            <div>
              <Label>Contacts</Label>
              <ContactsMultiSelect
                value={formData.contactIds}
                onValueChange={(ids) => setFormData({ ...formData, contactIds: ids })}
                organisationId={formData.organisationId || undefined}
                placeholder="Select contacts from organisation..."
                disabled={!formData.organisationId}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.organisationId
                  ? 'Select contacts from the chosen organisation'
                  : 'Select an organisation first'}
              </p>
            </div>

            {/* Deal Selector */}
            <div>
              <Label>Deal (optional)</Label>
              <Select
                value={formData.dealId || "none"}
                onValueChange={(value) => setFormData({
                  ...formData,
                  dealId: value === "none" ? '' : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Deal</SelectItem>
                  {deals
                    .filter(deal => !formData.organisationId || deal.organisationId === formData.organisationId)
                    .map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsible User Selector */}
            <div>
              <Label>Responsible User (optional)</Label>
              <UserSelect
                value={formData.responsibleUserId || undefined}
                onValueChange={(value) => setFormData({
                  ...formData,
                  responsibleUserId: value || ''
                })}
                placeholder="Assign to user..."
                includeEmpty
                emptyLabel="Unassigned"
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.title || !formData.organisationId}
            >
              Create Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Contracts"
        description="Manage legal agreements and contracts"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Contracts' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 overflow-hidden">
          {/* Header Section with Search and Actions */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-10 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && searchQuery) {
                      setSearchQuery('');
                      e.currentTarget.blur();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-muted"
                    title="Clear search (Esc)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Clear All
                  </Button>
                )}
                {newContractButton}
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filters:</span>

              {/* Status Filter */}
              <div className="min-w-[160px]">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={ContractStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={ContractStatus.SENT}>Sent</SelectItem>
                    <SelectItem value={ContractStatus.SIGNED}>Signed</SelectItem>
                    <SelectItem value={ContractStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ContractStatus.EXPIRED}>Expired</SelectItem>
                    <SelectItem value={ContractStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="min-w-[160px]">
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ContractType.MASTER}>Master</SelectItem>
                    <SelectItem value={ContractType.ORDER}>Order</SelectItem>
                    <SelectItem value={ContractType.NDA}>NDA</SelectItem>
                    <SelectItem value={ContractType.SERVICE}>Service</SelectItem>
                    <SelectItem value={ContractType.AMENDMENT}>Amendment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filter Summary */}
            {(searchQuery || filters.status || filters.type) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Active:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Search: "{searchQuery}"
                  </span>
                )}

                {filters.status && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Status: {filters.status}
                  </span>
                )}

                {filters.type && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Type: {filters.type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-3">
                        <FileText className="h-12 w-12 text-text-tertiary" />
                        <div className="text-text-secondary">
                          {hasActiveFilters ? 'No contracts match your filters' : 'No contracts found'}
                        </div>
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={clearFilters} className="text-sm">
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/crm/contracts/${contract.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contract.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-mono bg-surface-100 px-2 py-1 rounded">
                          {contract.contractNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {contract.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(contract.status)}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.amount
                          ? `${contract.currency || 'USD'} ${contract.amount.toLocaleString()}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(contract.updatedAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
