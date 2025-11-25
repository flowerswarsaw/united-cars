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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Keyboard,
  Archive,
  ArchiveRestore,
  UserPlus,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { Lead, Pipeline, Organisation } from '@united-cars/crm-core';
import { LocationFieldGroup } from '@/components/location';
import { getCountryByCode, hasRegions, getRegionDisplayName } from '@/lib/countries-regions';
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
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
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
  const [stages, setStages] = useState<any[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertData, setConvertData] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    pipelineId: '',
    stageId: '',
    notes: ''
  });
  const [createData, setCreateData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    title: '',
    isTarget: false,
    notes: '',
    country: '',
    state: '',
    city: '',
    zipCode: ''
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    leads: Lead[];
    contacts: any[];
  } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Add archive filter based on active tab
      params.append('isArchived', activeTab === 'archive' ? 'true' : 'false');

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
  }, [activeTab, searchQuery, filters.target, filters.pipelineId, filters.source, filters.minScore, filters.maxScore, filters.organisationId]);

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

  const loadStages = async (pipelineId: string) => {
    try {
      const response = await fetch(`/api/crm/pipelines/${pipelineId}`);
      const pipeline = await response.json();
      setStages(pipeline.stages || []);

      // Set first stage as default
      if (pipeline.stages && pipeline.stages.length > 0) {
        setConvertData(prev => ({
          ...prev,
          stageId: pipeline.stages[0].id
        }));
      }
    } catch (error) {
      console.error('Failed to load stages:', error);
      setStages([]);
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

  const checkForDuplicates = async (email?: string, phone?: string) => {
    if (!email && !phone) {
      setDuplicateWarning(null);
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      const response = await fetch('/api/crm/leads/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });

      if (response.ok) {
        const duplicates = await response.json();
        if (duplicates.leads.length > 0 || duplicates.contacts.length > 0) {
          setDuplicateWarning(duplicates);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
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
          jobTitle: '',
          title: '',
          isTarget: false,
          notes: '',
          country: '',
          state: '',
          city: '',
          zipCode: ''
        });
        setDuplicateWarning(null);
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
      title: lead.title || `${lead.firstName} ${lead.lastName} - Deal`,
      notes: lead.notes || ''
    }));

    // Load stages for the current pipeline
    if (convertData.pipelineId) {
      loadStages(convertData.pipelineId);
    }

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
        ...(convertData.stageId && { stageId: convertData.stageId }),
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
          stageId: '',
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

  const archiveLead = async (leadId: string, reason: 'not_qualified' | 'duplicate' | 'invalid' = 'not_qualified') => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, userId: user?.id })
      });

      if (response.ok) {
        toast.success('Lead archived successfully');
        loadLeads();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to archive lead');
      }
    } catch (error) {
      console.error('Failed to archive lead:', error);
      toast.error('Failed to archive lead');
    }
  };

  const restoreLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        toast.success('Lead restored successfully');
        loadLeads();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to restore lead');
      }
    } catch (error) {
      console.error('Failed to restore lead:', error);
      toast.error('Failed to restore lead');
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
                    onChange={(e) => {
                      setCreateData({ ...createData, email: e.target.value });
                      if (e.target.value) {
                        checkForDuplicates(e.target.value, createData.phone);
                      }
                    }}
                    placeholder="john.doe@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={createData.phone}
                    onChange={(e) => {
                      setCreateData({ ...createData, phone: e.target.value });
                      if (e.target.value) {
                        checkForDuplicates(createData.email, e.target.value);
                      }
                    }}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={createData.jobTitle}
                    onChange={(e) => setCreateData({ ...createData, jobTitle: e.target.value })}
                    placeholder="Sales Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="leadTitle">Lead Title</Label>
                  <Input
                    id="leadTitle"
                    value={createData.title}
                    onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                    placeholder="Partnership Opportunity"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div>
                <Label className="mb-2 block">Location Information</Label>
                <LocationFieldGroup
                  value={{
                    country: createData.country,
                    state: createData.state,
                    city: createData.city,
                    zipCode: createData.zipCode
                  }}
                  onChange={(location) => setCreateData({
                    ...createData,
                    country: location.country,
                    state: location.state,
                    city: location.city,
                    zipCode: location.zipCode || ''
                  })}
                  showZipCode={true}
                  required={false}
                  layout="grid"
                />
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (duplicateWarning.leads.length > 0 || duplicateWarning.contacts.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Potential Duplicate Found
                      </h4>
                      <div className="text-sm text-yellow-700 space-y-2">
                        {duplicateWarning.leads.length > 0 && (
                          <div>
                            <p className="font-medium">Existing Leads:</p>
                            {duplicateWarning.leads.map(lead => (
                              <div key={lead.id} className="ml-4">
                                • {lead.firstName} {lead.lastName} ({lead.email || lead.phone})
                              </div>
                            ))}
                          </div>
                        )}
                        {duplicateWarning.contacts.length > 0 && (
                          <div>
                            <p className="font-medium">Existing Contacts:</p>
                            {duplicateWarning.contacts.map(contact => (
                              <div key={contact.id} className="ml-4">
                                • {contact.firstName} {contact.lastName}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs italic">
                          Consider reviewing these existing records before creating a new lead.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
              
              {/* New Lead Button */}
              <div className="flex-shrink-0">
                {newLeadButton}
              </div>
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

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={(value: 'active' | 'archive') => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Active Leads
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-3">
                            <UserPlus className="h-12 w-12 text-gray-300" />
                            <div className="text-gray-500">
                              {hasActiveFilters ? 'No active leads match your filters' : 'No active leads found'}
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
                              <div>
                                <div className="font-medium">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.title}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="truncate max-w-xs">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {lead.jobTitle && (
                                <div className="font-medium">{lead.jobTitle}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {lead.city && lead.state ? (
                                <div>{lead.city}, {hasRegions(lead.country || '') ? getRegionDisplayName(lead.country || '', lead.state) : lead.state}</div>
                              ) : lead.city ? (
                                <div>{lead.city}</div>
                              ) : lead.country ? (
                                <div>{getCountryByCode(lead.country)?.name || lead.country}</div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
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
                            <div className="flex items-center space-x-2">
                              {lead.isTarget ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openConvertDialog(lead)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Convert
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => archiveLead(lead.id, 'not_qualified')}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  <Archive className="h-4 w-4 mr-1" />
                                  Archive
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Archived</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-3">
                            <Archive className="h-12 w-12 text-gray-300" />
                            <div className="text-gray-500">
                              {hasActiveFilters ? 'No archived leads match your filters' : 'No archived leads found'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.title}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="truncate max-w-xs">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {lead.jobTitle && (
                                <div className="font-medium">{lead.jobTitle}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {lead.city && lead.state ? (
                                <div>{lead.city}, {hasRegions(lead.country || '') ? getRegionDisplayName(lead.country || '', lead.state) : lead.state}</div>
                              ) : lead.city ? (
                                <div>{lead.city}</div>
                              ) : lead.country ? (
                                <div>{getCountryByCode(lead.country)?.name || lead.country}</div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {lead.archivedAt ? new Date(lead.archivedAt).toLocaleDateString() : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {lead.archivedReason || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreLead(lead.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ArchiveRestore className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pipeline">Pipeline</Label>
                <Select
                  value={convertData.pipelineId}
                  onValueChange={(value) => {
                    setConvertData(prev => ({ ...prev, pipelineId: value, stageId: '' }));
                    loadStages(value);
                  }}
                >
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
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={convertData.stageId}
                  onValueChange={(value) => setConvertData(prev => ({ ...prev, stageId: value }))}
                  disabled={!convertData.pipelineId || stages.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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