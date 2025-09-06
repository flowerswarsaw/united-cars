"use client";

import { useEffect, useState, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Target, 
  ArrowRight, 
  ToggleLeft, 
  ToggleRight,
  Building2,
  User,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Keyboard
} from 'lucide-react';
import { Lead, Pipeline, Organisation } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

interface LeadFilters {
  target: 'all' | 'target' | 'non-target';
  pipelineId: string;
  source: string;
  minScore: string;
  maxScore: string;
  organisationId: string;
}

export default function LeadsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({
    target: 'all',
    pipelineId: '',
    source: '',
    minScore: '',
    maxScore: '',
    organisationId: ''
  });
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertData, setConvertData] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    pipelineId: '',
    notes: ''
  });
  const [createData, setCreateData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    isTarget: false,
    notes: ''
  });

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (filters.target !== 'all') {
        params.append('isTarget', filters.target === 'target' ? 'true' : 'false');
      }
      
      if (filters.pipelineId && filters.pipelineId !== 'all') {
        params.append('pipelineId', filters.pipelineId);
      }
      
      if (filters.source.trim()) {
        params.append('source', filters.source.trim());
      }
      
      if (filters.minScore.trim()) {
        params.append('minScore', filters.minScore.trim());
      }
      
      if (filters.maxScore.trim()) {
        params.append('maxScore', filters.maxScore.trim());
      }
      
      if (filters.organisationId && filters.organisationId !== 'all') {
        params.append('organisationId', filters.organisationId);
      }
      
      const url = params.toString() 
        ? `/api/crm/leads?${params.toString()}`
        : '/api/crm/leads';
      
      const response = await fetch(url);
      const data = await response.json();
      setLeads(data || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      toast.error('Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.target, filters.pipelineId, filters.source, filters.minScore, filters.maxScore, filters.organisationId]);

  useEffect(() => {
    loadPipelines();
    loadOrganisations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLeads();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadLeads]);

  useEffect(() => {
    // Auto-open creation dialog if create parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateOpen(true);
      // Remove the parameter from URL without refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const loadPipelines = async () => {
    try {
      const data = await fetch('/api/crm/pipelines').then(r => r.json());
      setPipelines(data || []);
      
      // Set default pipeline
      if (data.length > 0 && !convertData.pipelineId) {
        const dealerPipeline = data.find((p: Pipeline) => p.name === 'Dealer');
        setConvertData(prev => ({
          ...prev,
          pipelineId: dealerPipeline?.id || data[0].id
        }));
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
      toast.error('Failed to load pipelines');
      setPipelines([]);
    }
  };

  const loadOrganisations = async () => {
    try {
      const data = await fetch('/api/crm/organisations').then(r => r.json());
      setOrganisations(data || []);
    } catch (error) {
      console.error('Failed to load organisations:', error);
      setOrganisations([]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      target: 'all',
      pipelineId: '',
      source: '',
      minScore: '',
      maxScore: '',
      organisationId: ''
    });
    setIsFiltersExpanded(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    filters.target !== 'all' ||
    (filters.pipelineId && filters.pipelineId !== 'all') ||
    filters.source ||
    filters.minScore ||
    filters.maxScore ||
    (filters.organisationId && filters.organisationId !== 'all')
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            document.getElementById('leads-search')?.focus();
            break;
          case 'f':
            event.preventDefault();
            setIsFiltersExpanded(prev => !prev);
            break;
          case 'Escape':
            if (hasActiveFilters) {
              event.preventDefault();
              clearFilters();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasActiveFilters]);

  const toggleTarget = async (leadId: string, currentTarget: boolean) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTarget: !currentTarget })
      });

      if (response.ok) {
        setLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, isTarget: !currentTarget } : lead
        ));
        
        toast.success(`Lead ${!currentTarget ? 'marked as target' : 'unmarked as target'}`);
      }
    } catch (error) {
      console.error('Failed to toggle target:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });
      
      if (response.ok) {
        const newLead = await response.json();
        setIsCreateOpen(false);
        setCreateData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          title: '',
          isTarget: false,
          notes: ''
        });
        loadLeads();
        
        toast.success(`Lead created: ${newLead.firstName} ${newLead.lastName}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const openConvertDialog = (lead: Lead) => {
    if (!lead.isTarget) {
      toast.error('Only target leads can be converted to deals');
      return;
    }
    
    setSelectedLead(lead);
    setConvertData(prev => ({
      ...prev,
      title: lead.title || 'New Deal',
      notes: lead.notes || ''
    }));
    setConvertDialogOpen(true);
  };

  const handleConvert = async () => {
    if (!selectedLead) return;

    try {
      const payload = {
        title: convertData.title,
        ...(convertData.amount && { amount: parseFloat(convertData.amount) }),
        currency: convertData.currency,
        pipelineId: convertData.pipelineId,
        notes: convertData.notes
      };

      const response = await fetch(`/api/crm/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const deal = await response.json();
        setConvertDialogOpen(false);
        setSelectedLead(null);
        setConvertData({
          title: '',
          amount: '',
          currency: 'USD',
          pipelineId: convertData.pipelineId,
          notes: ''
        });
        
        toast.success(`Lead converted: ${deal.title} has been created and added to the pipeline`);
        
        // Refresh leads
        loadLeads();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to convert lead');
      }
    } catch (error) {
      console.error('Failed to convert lead:', error);
      toast.error('Failed to convert lead');
    }
  };

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Leads"
          description="Manage your sales prospects"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
        />
        <LoadingState text="Loading leads..." />
      </AppLayout>
    );
  }

  const newLeadButton = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={createData.firstName}
                    onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={createData.lastName}
                    onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    placeholder="john.doe@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={createData.phone}
                    onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={createData.company}
                    onChange={(e) => setCreateData({ ...createData, company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={createData.title}
                    onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                    placeholder="Sales Manager"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={createData.notes}
                  onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                  placeholder="Lead notes..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isTarget"
                  checked={createData.isTarget}
                  onChange={(e) => setCreateData({ ...createData, isTarget: e.target.checked })}
                />
                <Label htmlFor="isTarget">Mark as target lead</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!createData.firstName || !createData.lastName}>
                  Create Lead
                </Button>
              </div>
            </div>
          </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Leads"
        description="Manage your sales prospects"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={newLeadButton}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="leads-search"
                  placeholder="Search leads... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Quick Target Filter */}
              <Select value={filters.target} onValueChange={(value: any) => setFilters({ ...filters, target: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="target">Target Leads</SelectItem>
                  <SelectItem value="non-target">Non-Target Leads</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filter Toggle */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <Filter className="h-4 w-4" />
                More Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] text-xs">
                    {[searchQuery, filters.target !== 'all', filters.pipelineId && filters.pipelineId !== 'all', filters.source, filters.minScore, filters.maxScore, filters.organisationId && filters.organisationId !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
                {isFiltersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            
            {/* Filters Panel */}
            {isFiltersExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pipeline Filter */}
                  <div>
                    <Label htmlFor="pipeline-filter" className="text-sm font-medium text-gray-700 mb-1 block">
                      Pipeline
                    </Label>
                    <Select
                      value={filters.pipelineId || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, pipelineId: value === 'all' ? '' : value })}
                    >
                      <SelectTrigger id="pipeline-filter">
                        <SelectValue placeholder="All Pipelines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pipelines</SelectItem>
                        {pipelines.map(pipeline => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Organisation Filter */}
                  <div>
                    <Label htmlFor="organisation-filter-leads" className="text-sm font-medium text-gray-700 mb-1 block">
                      Organisation
                    </Label>
                    <Select
                      value={filters.organisationId || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, organisationId: value === 'all' ? '' : value })}
                    >
                      <SelectTrigger id="organisation-filter-leads">
                        <SelectValue placeholder="All Organisations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organisations</SelectItem>
                        {organisations.map(org => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Source Filter */}
                  <div>
                    <Label htmlFor="source-filter" className="text-sm font-medium text-gray-700 mb-1 block">
                      Source
                    </Label>
                    <Input
                      id="source-filter"
                      placeholder="Lead source..."
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    />
                  </div>
                  
                  {/* Score Range Filters */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">
                      Score Range
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Min"
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Max"
                        type="number"
                        min="0"
                        max="100"
                        value={filters.maxScore}
                        onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Keyboard Shortcuts Info */}
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Keyboard className="h-3 w-3" />
                      <span className="font-medium">Shortcuts</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>⌘K - Focus search</div>
                      <div>⌘F - Toggle filters</div>
                      <div>ESC - Clear filters</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <Target className="h-12 w-12 text-gray-300" />
                    <div className="text-gray-500">
                      {hasActiveFilters ? 'No leads match your filters' : 'No leads found'}
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
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Target className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          <span dangerouslySetInnerHTML={{ 
                            __html: searchQuery 
                              ? lead.title.replace(
                                  new RegExp(`(${searchQuery})`, 'gi'),
                                  '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                )
                              : lead.title
                          }} />
                        </div>
                        {lead.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {lead.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTarget(lead.id, lead.isTarget)}
                      className="p-0"
                    >
                      {lead.isTarget ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {lead.score ? (
                      <Badge variant={lead.score >= 70 ? 'default' : 'secondary'}>
                        {lead.score}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      {lead.organisationId && (
                        <div className="flex items-center mr-2">
                          <Building2 className="h-3 w-3 mr-1" />
                          Org
                        </div>
                      )}
                      {lead.contactId && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Contact
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openConvertDialog(lead)}
                      disabled={!lead.isTarget}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={convertData.title}
                onChange={(e) => setConvertData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter deal title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={convertData.amount}
                  onChange={(e) => setConvertData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={convertData.currency} onValueChange={(value) => setConvertData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="pipeline">Pipeline</Label>
              <Select value={convertData.pipelineId} onValueChange={(value) => setConvertData(prev => ({ ...prev, pipelineId: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(pipeline => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={convertData.notes}
                onChange={(e) => setConvertData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Deal notes..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvert} disabled={!convertData.title}>
                Convert to Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}