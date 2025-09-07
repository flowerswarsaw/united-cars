"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, X } from 'lucide-react';
import KanbanBoard from './kanban-board';
import { Deal, Pipeline, LossReason, Organisation, Contact, ContactMethodType, Task, EntityType } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

// Helper functions to get contact methods
const getEmail = (contactMethods?: Array<{type: ContactMethodType, value: string, isPrimary?: boolean}>) => {
  return contactMethods?.find(cm => 
    cm.type === ContactMethodType.EMAIL_WORK || 
    cm.type === ContactMethodType.EMAIL_PERSONAL ||
    cm.type === ContactMethodType.EMAIL_OTHER
  )?.value;
};

const getPhone = (contactMethods?: Array<{type: ContactMethodType, value: string, isPrimary?: boolean}>) => {
  return contactMethods?.find(cm => 
    cm.type === ContactMethodType.PHONE_WORK || 
    cm.type === ContactMethodType.PHONE_HOME ||
    cm.type === ContactMethodType.PHONE_MOBILE ||
    cm.type === ContactMethodType.PHONE_OTHER ||
    cm.type === ContactMethodType.PHONE_FAX
  )?.value;
};

export default function DealsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    probability: '',
    organisationId: '',
    contactId: ''
  });
  const [pipelineFormData, setPipelineFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'won' | 'lost'>(() => {
    // Initialize state with value from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('deals-status-filter');
        if (saved && ['all', 'open', 'won', 'lost'].includes(saved)) {
          return saved as 'all' | 'open' | 'won' | 'lost';
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }
    return 'all';
  });
  const [quickAddStageId, setQuickAddStageId] = useState<string | null>(null);

  // Save status filter to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deals-status-filter', statusFilter);
      } catch (error) {
        console.error('Error saving status filter to localStorage:', error);
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, []);

  // Simple keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search on Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search deals"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Robust search with debouncing for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150); // 150ms debounce for smoother UX
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadData = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      // Individual fetch functions with error handling
      const fetchWithRetry = async (url: string, maxRetries = 3) => {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
              console.warn(`Invalid data format from ${url}:`, data);
              return [];
            }
            return data;
          } catch (error) {
            if (i === maxRetries) throw error;
            console.warn(`Retry ${i + 1}/${maxRetries} for ${url}:`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      };

      const [pipelinesData, dealsData, organisationsData, contactsData, tasksData] = await Promise.allSettled([
        fetchWithRetry('/api/crm/pipelines'),
        fetchWithRetry('/api/crm/deals'),
        fetchWithRetry('/api/crm/organisations'),
        fetchWithRetry('/api/crm/contacts'),
        fetchWithRetry('/api/crm/tasks')
      ]);

      // Handle results with fallbacks
      const pipelines = pipelinesData.status === 'fulfilled' ? pipelinesData.value : [];
      const deals = dealsData.status === 'fulfilled' ? dealsData.value : [];
      const organisations = organisationsData.status === 'fulfilled' ? organisationsData.value : [];
      const contacts = contactsData.status === 'fulfilled' ? contactsData.value : [];
      const tasks = tasksData.status === 'fulfilled' ? tasksData.value : [];

      // Log any failures
      if (pipelinesData.status === 'rejected') console.error('Failed to load pipelines:', pipelinesData.reason);
      if (dealsData.status === 'rejected') console.error('Failed to load deals:', dealsData.reason);
      if (organisationsData.status === 'rejected') console.error('Failed to load organisations:', organisationsData.reason);
      if (contactsData.status === 'rejected') console.error('Failed to load contacts:', contactsData.reason);
      if (tasksData.status === 'rejected') console.error('Failed to load tasks:', tasksData.reason);

      setPipelines(pipelines || []);
      setDeals(deals || []);
      setOrganisations(organisations || []);
      setContacts(contacts || []);
      setTasks(tasks || []);

      // Set default active pipeline
      if (pipelines && pipelines.length > 0 && !activePipelineId) {
        const dealerPipeline = pipelines.find((p: Pipeline) => p.name === 'Dealer');
        setActivePipelineId(dealerPipeline?.id || pipelines[0].id);
      }

      // Show partial success message if some data failed to load
      const failedCount = [pipelinesData, dealsData, organisationsData, contactsData, tasksData]
        .filter(result => result.status === 'rejected').length;
      
      if (failedCount > 0 && failedCount < 5) {
        toast.error(`Some data failed to load (${failedCount} of 5 sources)`);
      } else if (failedCount === 5) {
        toast.error('Failed to load CRM data. Please refresh the page.');
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      if (retryCount < 2) {
        console.log(`Retrying data load (attempt ${retryCount + 2}/3)...`);
        setTimeout(() => loadData(retryCount + 1), 2000);
        return;
      }
      toast.error('Failed to load deals data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDealMoved = async (
    dealId: string,
    toStageId: string,
    note?: string,
    lossReason?: LossReason
  ) => {
    const activePipeline = pipelines.find(p => p.id === activePipelineId);
    if (!activePipeline) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: activePipelineId,
          toStageId,
          note,
          lossReason
        })
      });

      if (response.ok) {
        const updatedDeal = await response.json();
        setDeals(prev => prev.map(deal => 
          deal.id === dealId ? updatedDeal : deal
        ));

        const stage = activePipeline.stages?.find(s => s.id === toStageId);
        
        if (stage?.isClosing) {
          toast.success(`Deal Won! ${updatedDeal.title} has been marked as won and moved to integration pipeline.`);
        } else if (stage?.isLost) {
          toast.error(`Deal Lost: ${updatedDeal.title} has been marked as lost: ${lossReason}`);
        } else {
          toast.success(`Deal Moved: ${updatedDeal.title} moved to ${stage?.name}`);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to move deal');
      }
    } catch (error) {
      console.error('Failed to move deal:', error);
      toast.error('Failed to move deal');
    }
  };

  const handleDealUpdated = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(deal => 
      deal.id === updatedDeal.id ? updatedDeal : deal
    ));
    toast.success(`Deal updated: ${updatedDeal.title}`);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    toast.success(`Task created: ${newTask.title}`);
  };

  const handleOrganisationClick = (orgId: string) => {
    const org = organisations.find(o => o.id === orgId);
    if (org) {
      setSelectedOrg(org);
      setShowOrgDialog(true);
    }
  };

  const handleContactClick = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      setShowContactDialog(true);
    }
  };

  const handleCreatePipeline = async () => {
    if (!pipelineFormData.name) return;

    try {
      const response = await fetch('/api/crm/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pipelineFormData.name,
          description: pipelineFormData.description || undefined,
          color: pipelineFormData.color,
          order: pipelines.length
        })
      });

      if (response.ok) {
        const newPipeline = await response.json();
        setPipelines(prev => [...prev, newPipeline]);
        setShowPipelineDialog(false);
        setPipelineFormData({
          name: '',
          description: '',
          color: '#3B82F6'
        });
        toast.success(`Pipeline Created: ${newPipeline.name} has been created successfully.`);
        
        // Set as active pipeline if it's the first one
        if (pipelines.length === 0) {
          setActivePipelineId(newPipeline.id);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create pipeline');
      }
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      toast.error('Failed to create pipeline');
    }
  };

  const generateDealTitle = (orgId?: string, contactId?: string): string => {
    const date = new Date();
    const shortDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
    
    if (orgId) {
      const org = organisations.find(o => o.id === orgId);
      if (org) {
        return `Deal with ${org.name} - ${shortDate}`;
      }
    }
    
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        return `Deal with ${contact.firstName} ${contact.lastName} - ${shortDate}`;
      }
    }
    
    return `New Deal - ${shortDate}`;
  };

  const handleCreate = async () => {
    if (!formData.title || !activePipelineId) return;

    try {
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          currency: formData.currency,
          probability: formData.probability ? parseInt(formData.probability) : undefined,
          organisationId: formData.organisationId || undefined,
          contactId: formData.contactId || undefined,
          status: 'OPEN',
          pipelineId: activePipelineId,
          stageId: quickAddStageId || undefined
        })
      });

      if (response.ok) {
        const newDeal = await response.json();
        setDeals(prev => [...prev, newDeal]);
        setIsCreateOpen(false);
        setFormData({
          title: '',
          description: '',
          amount: '',
          currency: 'USD',
          probability: '',
          organisationId: '',
          contactId: ''
        });
        setQuickAddStageId(null);
        toast.success(`Deal Created: ${newDeal.title} has been created successfully.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create deal');
      }
    } catch (error) {
      console.error('Failed to create deal:', error);
      toast.error('Failed to create deal');
    }
  };

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Deals"
          description="Manage your sales pipeline"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Deals' }]}
        />
        <LoadingState text="Loading CRM data..." />
      </AppLayout>
    );
  }

  const activePipeline = pipelines.find(p => p.id === activePipelineId);
  const pipelineDeals = deals.filter(deal => {
    return deal.currentStages?.some(cs => cs.pipelineId === activePipelineId);
  });

  // Calculate deals by stage for all deals (before filtering)
  const stages = activePipeline?.stages || [];
  const allDealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = pipelineDeals.filter(deal => {
      const currentStage = deal.currentStages?.find(cs => cs.pipelineId === activePipelineId);
      return currentStage?.stageId === stage.id;
    });
    return acc;
  }, {} as Record<string, Deal[]>);

  // Simple filter and search deals with robust logic
  const hasActiveFilters = Boolean(
    debouncedSearchQuery?.trim() || 
    (statusFilter && statusFilter !== 'all')
  );

  // Get filtered stages based on status filter
  const getFilteredStages = (pipeline: Pipeline) => {
    if (!pipeline.stages) return [];
    
    switch (statusFilter) {
      case 'won':
        return pipeline.stages.filter(stage => stage.isClosing);
      case 'lost':
        return pipeline.stages.filter(stage => stage.isLost);
      case 'open':
        return pipeline.stages.filter(stage => !stage.isClosing && !stage.isLost);
      default:
        return pipeline.stages;
    }
  };

  const filteredDeals = pipelineDeals.filter(deal => {
    // Search filter - comprehensive text matching across all related data
    if (debouncedSearchQuery?.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      
      // Get connected organization data
      const organization = organisations.find(org => org.id === deal.organisationId);
      const organizationSearchFields = organization ? [
        organization.name,
        organization.companyId,
        organization.industry,
        organization.size,
        organization.website,
        organization.address,
        organization.city,
        organization.state,
        organization.country,
        organization.postalCode,
        organization.notes,
        // Organization contact methods (emails, phones, etc.)
        ...(organization.contactMethods || []).map(cm => cm.value),
        // Organization tags
        ...(organization.tags || [])
      ] : [];
      
      // Get connected contact data
      const contact = contacts.find(c => c.id === deal.contactId);
      const contactSearchFields = contact ? [
        contact.firstName,
        contact.lastName,
        `${contact.firstName} ${contact.lastName}`.trim(),
        contact.title,
        contact.address,
        contact.city,
        contact.state,
        contact.country,
        contact.postalCode,
        contact.notes,
        // Contact methods (emails, phones, etc.)
        ...(contact.contactMethods || []).map(cm => cm.value),
        // Contact tags
        ...(contact.tags || [])
      ] : [];
      
      // Combine all searchable fields
      const allSearchFields = [
        // Deal core data
        deal.title,
        deal.notes,
        deal.amount?.toString(),
        deal.currency,
        deal.status,
        // Organization data
        ...organizationSearchFields,
        // Contact data
        ...contactSearchFields
      ];
      
      const matches = allSearchFields.some(field => 
        field && typeof field === 'string' && field.trim() && field.toLowerCase().includes(query)
      );
      
      if (!matches) return false;
    }

    // Status filter based on stage properties
    if (statusFilter && statusFilter !== 'all') {
      const dealCurrentStage = deal.currentStages?.find(cs => cs.pipelineId === activePipelineId);
      if (dealCurrentStage) {
        const stage = activePipeline?.stages?.find(s => s.id === dealCurrentStage.stageId);
        if (stage) {
          switch (statusFilter) {
            case 'won':
              if (!stage.isClosing) return false;
              break;
            case 'lost':
              if (!stage.isLost) return false;
              break;
            case 'open':
              if (stage.isClosing || stage.isLost) return false;
              break;
          }
        }
      } else if (statusFilter !== 'open') {
        // If deal has no current stage, only show it in 'open' filter
        return false;
      }
    }

    return true;
  });

  // Function to get deal count for any pipeline
  const getDealCountForPipeline = (pipelineId: string) => {
    return deals.filter(deal => 
      deal.currentStages?.some(cs => cs.pipelineId === pipelineId)
    ).length;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleQuickAddDeal = (stageId: string) => {
    setQuickAddStageId(stageId);
    setIsCreateOpen(true);
    // Auto-generate title based on stage
    const stage = activePipeline?.stages?.find(s => s.id === stageId);
    if (stage) {
      setFormData(prev => ({
        ...prev,
        title: `New Deal - ${stage.name}`,
        organisationId: '',
        contactId: ''
      }));
    }
  };

  const newDealButton = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Deal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter deal title"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="organisationId">Organisation</Label>
                  <Select value={formData.organisationId || undefined} onValueChange={(value) => {
                    const newOrgId = value || '';
                    const shouldAutoGenerate = !formData.title || formData.title.includes('Deal with') || formData.title.startsWith('New Deal');
                    setFormData({ 
                      ...formData, 
                      organisationId: newOrgId,
                      contactId: '', // Clear contact when org is selected
                      title: shouldAutoGenerate ? generateDealTitle(newOrgId, undefined) : formData.title
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organisation (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {organisations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contactId">Contact</Label>
                  <Select value={formData.contactId || undefined} onValueChange={(value) => {
                    const newContactId = value || '';
                    const shouldAutoGenerate = !formData.title || formData.title.includes('Deal with') || formData.title.startsWith('New Deal');
                    setFormData({ 
                      ...formData, 
                      contactId: newContactId,
                      // Don't clear org if contact is from same org
                      title: shouldAutoGenerate ? generateDealTitle(formData.organisationId, newContactId) : formData.title
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        formData.organisationId 
                          ? "Select contact from organisation" 
                          : "Select any contact (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.organisationId ? (
                        // Show only contacts from selected organisation
                        contacts
                          .filter(contact => contact.organisationId === formData.organisationId)
                          .map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName}
                            </SelectItem>
                          ))
                      ) : (
                        // Show all contacts when no organisation is selected
                        contacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                            {contact.organisationId && (
                              <span className="text-muted-foreground text-xs ml-2">
                                ({organisations.find(org => org.id === contact.organisationId)?.name})
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
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
                  placeholder="Optional deal description..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title}>
                  Create Deal
                </Button>
              </div>
            </div>
          </DialogContent>
    </Dialog>
  );

  const orgDialog = selectedOrg && (
    <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedOrg.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-sm text-muted-foreground">Industry:</strong>
              <p className="text-sm">{selectedOrg.industry || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Company Size:</strong>
              <p className="text-sm">{selectedOrg.size || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Email:</strong>
              <p className="text-sm">{getEmail(selectedOrg.contactMethods) || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Phone:</strong>
              <p className="text-sm">{getPhone(selectedOrg.contactMethods) || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Website:</strong>
              <p className="text-sm">
                {selectedOrg.website ? (
                  <a href={selectedOrg.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedOrg.website}
                  </a>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Country:</strong>
              <p className="text-sm">{selectedOrg.country || 'Not specified'}</p>
            </div>
          </div>
          
          {selectedOrg.address && (
            <div>
              <strong className="text-sm text-muted-foreground">Address:</strong>
              <p className="text-sm">
                {selectedOrg.address}
                {selectedOrg.city && `, ${selectedOrg.city}`}
                {selectedOrg.state && `, ${selectedOrg.state}`}
                {selectedOrg.postalCode && ` ${selectedOrg.postalCode}`}
              </p>
            </div>
          )}

          {selectedOrg.notes && (
            <div>
              <strong className="text-sm text-muted-foreground">Notes:</strong>
              <p className="text-sm">{selectedOrg.notes}</p>
            </div>
          )}

          {selectedOrg.tags && selectedOrg.tags.length > 0 && (
            <div>
              <strong className="text-sm text-muted-foreground">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedOrg.tags.map(tag => (
                  <span key={tag} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            Created: {new Date(selectedOrg.createdAt).toLocaleString()}
            {selectedOrg.updatedAt !== selectedOrg.createdAt && (
              <span> • Updated: {new Date(selectedOrg.updatedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const contactDialog = selectedContact && (
    <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedContact.firstName} {selectedContact.lastName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-sm text-muted-foreground">First Name:</strong>
              <p className="text-sm">{selectedContact.firstName}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Last Name:</strong>
              <p className="text-sm">{selectedContact.lastName}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Email:</strong>
              <p className="text-sm">{getEmail(selectedContact.contactMethods) || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Phone:</strong>
              <p className="text-sm">{getPhone(selectedContact.contactMethods) || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Title:</strong>
              <p className="text-sm">{selectedContact.title || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-muted-foreground">Organisation:</strong>
              <p className="text-sm">
                {selectedContact.organisationId ? (
                  (() => {
                    const org = organisations.find(o => o.id === selectedContact.organisationId);
                    return org ? (
                      <button 
                        onClick={() => {
                          setShowContactDialog(false);
                          setSelectedOrg(org);
                          setShowOrgDialog(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        {org.name}
                      </button>
                    ) : 'Unknown';
                  })()
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
          </div>

          {selectedContact.address && (
            <div>
              <strong className="text-sm text-muted-foreground">Address:</strong>
              <p className="text-sm">
                {selectedContact.address}
                {selectedContact.city && `, ${selectedContact.city}`}
                {selectedContact.state && `, ${selectedContact.state}`}
                {selectedContact.postalCode && ` ${selectedContact.postalCode}`}
                {selectedContact.country && `, ${selectedContact.country}`}
              </p>
            </div>
          )}

          {selectedContact.notes && (
            <div>
              <strong className="text-sm text-muted-foreground">Notes:</strong>
              <p className="text-sm">{selectedContact.notes}</p>
            </div>
          )}

          {selectedContact.tags && selectedContact.tags.length > 0 && (
            <div>
              <strong className="text-sm text-muted-foreground">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedContact.tags.map(tag => (
                  <span key={tag} className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            Created: {new Date(selectedContact.createdAt).toLocaleString()}
            {selectedContact.updatedAt !== selectedContact.createdAt && (
              <span> • Updated: {new Date(selectedContact.updatedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout user={user}>
      {/* Page Header - Fixed */}
      <PageHeader 
        title="Deals"
        description="Manage your sales pipeline"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Deals' }]}
      />
      
      {/* Main Content Container - Full Height */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden bg-gradient-to-br from-slate-50/90 via-slate-50/70 to-indigo-50/50 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-indigo-950/50">
        <div className="px-3 sm:px-6 lg:px-8 flex-1 flex flex-col min-w-0 max-w-full min-h-0 pt-6 pb-8">
          <div className="flex-1 flex flex-col min-w-0 max-w-full min-h-0">
            <Tabs value={activePipelineId} onValueChange={setActivePipelineId} className="flex-1 flex flex-col min-w-0 max-w-full min-h-0">
            {/* Pipeline Tabs - Fixed Width */}
            <div className="border-b border-slate-200/60 dark:border-slate-700/60 px-3 sm:px-6 pt-6 w-full overflow-hidden bg-gradient-to-r from-card/95 via-card to-card/95 backdrop-blur-md shadow-sm">
              <div className="w-full overflow-x-auto">
                <TabsList className="mb-6 flex-nowrap bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-1">
                {pipelines.map((pipeline) => (
                  <TabsTrigger key={pipeline.id} value={pipeline.id}>
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: pipeline.color || '#6B7280' }}
                      />
                      {pipeline.name}
                      <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {getDealCountForPipeline(pipeline.id)}
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
                </TabsList>
              </div>
            </div>

            {pipelines.map((pipeline) => (
              <TabsContent key={pipeline.id} value={pipeline.id} className="data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:min-h-0 data-[state=active]:mt-0 data-[state=active]:min-w-0 data-[state=active]:max-w-full data-[state=active]:flex-col">
                {activePipeline?.id === pipeline.id && (
                  <div className="flex-1 flex flex-col min-w-0 max-w-full min-h-0 overflow-hidden">
                    {/* Simple Search and Filter Bar */}
                    <div className="border-b border-slate-200/50 dark:border-slate-700/50 px-4 sm:px-6 py-6 w-full overflow-hidden bg-gradient-to-r from-card/98 via-card to-card/98 backdrop-blur-md shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
                        {/* Left Side: Search and Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:items-center">
                          {/* Search Input */}
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="Search deals, contacts, organizations, phones, emails..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
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
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title="Clear search"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Status Filter */}
                          <div className="flex gap-2">
                            <Select
                              value={statusFilter}
                              onValueChange={(value) => {
                                setStatusFilter(value as 'all' | 'open' | 'won' | 'lost');
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="open">Open Stages</SelectItem>
                                <SelectItem value="won">Won Stages</SelectItem>
                                <SelectItem value="lost">Lost Stages</SelectItem>
                              </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Right Side: New Deal Button - Absolute Far Right */}
                        <div className="flex-shrink-0">
                          {newDealButton}
                        </div>
                      </div>

                      {/* Results summary */}
                      {hasActiveFilters && (
                        <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                          Showing <span className="font-medium text-foreground">{filteredDeals.length}</span> of <span className="font-medium text-foreground">{pipelineDeals.length}</span> deals
                        </div>
                      )}
                    </div>
                    
                    {/* Scrollable Kanban Board Content - Full Height */}
                    <div className="flex-1 min-w-0 w-full max-w-full min-h-0">
                      <KanbanBoard
                        pipeline={{
                          ...pipeline,
                          stages: getFilteredStages(pipeline)
                        }}
                        deals={filteredDeals}
                        organisations={organisations}
                        contacts={contacts}
                        tasks={tasks}
                        onDealMoved={handleDealMoved}
                        onDealUpdated={handleDealUpdated}
                        onTaskCreated={handleTaskCreated}
                        onOrganisationClick={handleOrganisationClick}
                        onContactClick={handleContactClick}
                        onQuickAddDeal={handleQuickAddDeal}
                        isFiltered={hasActiveFilters}
                        totalDeals={pipelineDeals.length}
                        allDealsByStage={allDealsByStage}
                        searchQuery={searchQuery}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
            
            {pipelines.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">No pipelines found</div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setShowPipelineDialog(true)}>
                    Create Pipeline
                  </Button>
                  <Button variant="ghost" onClick={() => loadData()}>
                    Refresh
                  </Button>
                </div>
              </div>
            )}
            </Tabs>
          </div>
        </div>
      </div>
      {orgDialog}
      {contactDialog}
      
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipelineName">Pipeline Name *</Label>
              <Input
                id="pipelineName"
                value={pipelineFormData.name}
                onChange={(e) => setPipelineFormData({ ...pipelineFormData, name: e.target.value })}
                placeholder="Enter pipeline name"
              />
            </div>
            <div>
              <Label htmlFor="pipelineDescription">Description</Label>
              <Textarea
                id="pipelineDescription"
                value={pipelineFormData.description}
                onChange={(e) => setPipelineFormData({ ...pipelineFormData, description: e.target.value })}
                placeholder="Pipeline description (optional)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="pipelineColor">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pipelineColor"
                  type="color"
                  value={pipelineFormData.color}
                  onChange={(e) => setPipelineFormData({ ...pipelineFormData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={pipelineFormData.color}
                  onChange={(e) => setPipelineFormData({ ...pipelineFormData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPipelineDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePipeline} disabled={!pipelineFormData.name}>
                Create Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </AppLayout>
  );
}