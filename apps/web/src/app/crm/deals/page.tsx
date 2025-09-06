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
import { Deal, Pipeline, LossReason, Organisation, Contact } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

export default function DealsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
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
  const [filters, setFilters] = useState({
    amountMin: '',
    amountMax: '',
    probability: '',
    organisation: 'all',
    contact: 'all',
    currency: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<{name: string, filters: any, search: string}[]>([]);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcuts useEffect - moved back to maintain hooks order
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
      
      // Toggle filters on Ctrl/Cmd + F
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowFilters(!showFilters);
      }
      
      // Clear all filters on Escape (when search input is not focused)
      if (event.key === 'Escape' && document.activeElement?.tagName !== 'INPUT') {
        const currentHasActiveFilters = searchQuery || Object.values(filters).some(value => value !== '' && value !== 'all');
        if (currentHasActiveFilters) {
          setSearchQuery('');
          setFilters({
            amountMin: '',
            amountMax: '',
            probability: '',
            organisation: 'all',
            contact: 'all',
            currency: 'all'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilters, searchQuery, filters]);

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

      const [pipelinesData, dealsData, organisationsData, contactsData] = await Promise.allSettled([
        fetchWithRetry('/api/crm/pipelines'),
        fetchWithRetry('/api/crm/deals'),
        fetchWithRetry('/api/crm/organisations'),
        fetchWithRetry('/api/crm/contacts')
      ]);

      // Handle results with fallbacks
      const pipelines = pipelinesData.status === 'fulfilled' ? pipelinesData.value : [];
      const deals = dealsData.status === 'fulfilled' ? dealsData.value : [];
      const organisations = organisationsData.status === 'fulfilled' ? organisationsData.value : [];
      const contacts = contactsData.status === 'fulfilled' ? contactsData.value : [];

      // Log any failures
      if (pipelinesData.status === 'rejected') console.error('Failed to load pipelines:', pipelinesData.reason);
      if (dealsData.status === 'rejected') console.error('Failed to load deals:', dealsData.reason);
      if (organisationsData.status === 'rejected') console.error('Failed to load organisations:', organisationsData.reason);
      if (contactsData.status === 'rejected') console.error('Failed to load contacts:', contactsData.reason);

      setPipelines(pipelines || []);
      setDeals(deals || []);
      setOrganisations(organisations || []);
      setContacts(contacts || []);

      // Set default active pipeline
      if (pipelines && pipelines.length > 0 && !activePipelineId) {
        const dealerPipeline = pipelines.find((p: Pipeline) => p.name === 'Dealer');
        setActivePipelineId(dealerPipeline?.id || pipelines[0].id);
      }

      // Show partial success message if some data failed to load
      const failedCount = [pipelinesData, dealsData, organisationsData, contactsData]
        .filter(result => result.status === 'rejected').length;
      
      if (failedCount > 0 && failedCount < 4) {
        toast.error(`Some data failed to load (${failedCount} of 4 sources)`);
      } else if (failedCount === 4) {
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
          pipelineId: activePipelineId
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

  // Filter and search deals
  const hasActiveFilters = Boolean(searchQuery || Object.values(filters).some(value => value !== '' && value !== 'all'));

  const filteredDeals = pipelineDeals.filter(deal => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = deal.title?.toLowerCase().includes(query);
      const matchesAmount = deal.amount?.toString().includes(query);
      const matchesOrg = organisations.find(org => org.id === deal.organisationId)?.name?.toLowerCase().includes(query);
      const matchesContact = contacts.find(c => c.id === deal.contactId)?.firstName?.toLowerCase().includes(query) ||
                           contacts.find(c => c.id === deal.contactId)?.lastName?.toLowerCase().includes(query);
      const matchesNotes = deal.notes?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesAmount && !matchesOrg && !matchesContact && !matchesNotes) {
        return false;
      }
    }

    // Amount range filter
    if (filters.amountMin && deal.amount && deal.amount < parseFloat(filters.amountMin)) {
      return false;
    }
    if (filters.amountMax && deal.amount && deal.amount > parseFloat(filters.amountMax)) {
      return false;
    }

    // Probability filter
    if (filters.probability && deal.probability && deal.probability < parseInt(filters.probability)) {
      return false;
    }

    // Organisation filter
    if (filters.organisation && filters.organisation !== 'all' && deal.organisationId !== filters.organisation) {
      return false;
    }

    // Contact filter
    if (filters.contact && filters.contact !== 'all' && deal.contactId !== filters.contact) {
      return false;
    }

    // Currency filter
    if (filters.currency && filters.currency !== 'all' && deal.currency !== filters.currency) {
      return false;
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
    setFilters({
      amountMin: '',
      amountMax: '',
      probability: '',
      organisation: 'all',
      contact: 'all',
      currency: 'all'
    });
  };

  const saveCurrentFilter = () => {
    if (!saveFilterName.trim() || !hasActiveFilters) return;
    
    const newSavedFilter = {
      name: saveFilterName,
      filters: { ...filters },
      search: searchQuery
    };
    
    setSavedFilters(prev => [...prev.filter(f => f.name !== saveFilterName), newSavedFilter]);
    setShowSaveFilter(false);
    setSaveFilterName('');
    toast.success(`Filter "${saveFilterName}" saved successfully`);
  };

  const loadSavedFilter = (savedFilter: any) => {
    setSearchQuery(savedFilter.search);
    setFilters(savedFilter.filters);
    setShowFilters(true);
  };

  const deleteSavedFilter = (name: string) => {
    setSavedFilters(prev => prev.filter(f => f.name !== name));
    toast.success(`Filter "${name}" deleted`);
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
                      organisationId: '', // Clear org when contact is selected
                      title: shouldAutoGenerate ? generateDealTitle(undefined, newContactId) : formData.title
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
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
              <strong className="text-sm text-gray-600">Industry:</strong>
              <p className="text-sm">{selectedOrg.industry || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Company Size:</strong>
              <p className="text-sm">{selectedOrg.size || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Email:</strong>
              <p className="text-sm">{selectedOrg.email || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Phone:</strong>
              <p className="text-sm">{selectedOrg.phone || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Website:</strong>
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
              <strong className="text-sm text-gray-600">Country:</strong>
              <p className="text-sm">{selectedOrg.country || 'Not specified'}</p>
            </div>
          </div>
          
          {selectedOrg.address && (
            <div>
              <strong className="text-sm text-gray-600">Address:</strong>
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
              <strong className="text-sm text-gray-600">Notes:</strong>
              <p className="text-sm">{selectedOrg.notes}</p>
            </div>
          )}

          {selectedOrg.tags && selectedOrg.tags.length > 0 && (
            <div>
              <strong className="text-sm text-gray-600">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedOrg.tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-3">
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
              <strong className="text-sm text-gray-600">First Name:</strong>
              <p className="text-sm">{selectedContact.firstName}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Last Name:</strong>
              <p className="text-sm">{selectedContact.lastName}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Email:</strong>
              <p className="text-sm">{selectedContact.email || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Phone:</strong>
              <p className="text-sm">{selectedContact.phone || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Title:</strong>
              <p className="text-sm">{selectedContact.title || 'Not specified'}</p>
            </div>
            <div>
              <strong className="text-sm text-gray-600">Organisation:</strong>
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
              <strong className="text-sm text-gray-600">Address:</strong>
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
              <strong className="text-sm text-gray-600">Notes:</strong>
              <p className="text-sm">{selectedContact.notes}</p>
            </div>
          )}

          {selectedContact.tags && selectedContact.tags.length > 0 && (
            <div>
              <strong className="text-sm text-gray-600">Tags:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedContact.tags.map(tag => (
                  <span key={tag} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-3">
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
      <PageHeader 
        title="Deals"
        description="Manage your sales pipeline"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Deals' }]}
        actions={newDealButton}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
          <div className="p-6 h-full flex flex-col min-h-0">
            <Tabs value={activePipelineId} onValueChange={setActivePipelineId} className="flex flex-col h-full">
            <TabsList className="mb-4 flex-shrink-0">
              {pipelines.map((pipeline) => (
                <TabsTrigger key={pipeline.id} value={pipeline.id}>
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: pipeline.color || '#6B7280' }}
                    />
                    {pipeline.name}
                    <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
                      {getDealCountForPipeline(pipeline.id)}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {pipelines.map((pipeline) => (
              <TabsContent key={pipeline.id} value={pipeline.id} className="flex-1 min-h-0 mt-0">
                {activePipeline?.id === pipeline.id && (
                  <div className="flex flex-col h-full">
                    {/* Search and Filter Bar */}
                    <div className="flex-shrink-0 mb-4 space-y-3">
                      <div className="flex gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search deals by title, amount, organisation, contact, or notes... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4"
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
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Filter Toggle Button */}
                        <Button
                          variant={showFilters ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowFilters(!showFilters)}
                          className="flex items-center gap-2"
                          title="Toggle filters (Ctrl+F)"
                        >
                          <Filter className="h-4 w-4" />
                          Filters
                          {hasActiveFilters && (
                            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {Object.values(filters).filter(v => v !== '').length + (searchQuery ? 1 : 0)}
                            </span>
                          )}
                        </Button>
                        
                        {/* Save Filter */}
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSaveFilter(true)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Save Filter
                          </Button>
                        )}
                        
                        {/* Clear Filters */}
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>

                      {/* Filter Panel */}
                      {showFilters && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Amount Range */}
                            <div>
                              <Label className="text-xs text-gray-600">Min Amount</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={filters.amountMin}
                                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Max Amount</Label>
                              <Input
                                type="number"
                                placeholder="∞"
                                value={filters.amountMax}
                                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            
                            {/* Probability */}
                            <div>
                              <Label className="text-xs text-gray-600">Min Probability (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={filters.probability}
                                onChange={(e) => setFilters({ ...filters, probability: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            
                            {/* Organisation */}
                            <div>
                              <Label className="text-xs text-gray-600">Organisation</Label>
                              <Select
                                value={filters.organisation}
                                onValueChange={(value) => setFilters({ ...filters, organisation: value })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="All" />
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
                            
                            {/* Contact */}
                            <div>
                              <Label className="text-xs text-gray-600">Contact</Label>
                              <Select
                                value={filters.contact}
                                onValueChange={(value) => setFilters({ ...filters, contact: value })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Contacts</SelectItem>
                                  {contacts.map(contact => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                      {contact.firstName} {contact.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Currency */}
                            <div>
                              <Label className="text-xs text-gray-600">Currency</Label>
                              <Select
                                value={filters.currency}
                                onValueChange={(value) => setFilters({ ...filters, currency: value })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Currencies</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Saved Filters */}
                          {savedFilters.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <Label className="text-xs text-gray-600 mb-2 block">Saved Filters</Label>
                              <div className="flex flex-wrap gap-2">
                                {savedFilters.map((savedFilter) => (
                                  <div key={savedFilter.name} className="flex items-center bg-blue-50 border border-blue-200 rounded-md">
                                    <button
                                      onClick={() => loadSavedFilter(savedFilter)}
                                      className="px-2 py-1 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-l-md"
                                      title={`Load filter: ${savedFilter.name}`}
                                    >
                                      {savedFilter.name}
                                    </button>
                                    <button
                                      onClick={() => deleteSavedFilter(savedFilter.name)}
                                      className="px-1.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-l border-blue-200 rounded-r-md"
                                      title="Delete saved filter"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Results summary */}
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                            Showing <span className="font-medium text-gray-900">{filteredDeals.length}</span> of <span className="font-medium text-gray-900">{pipelineDeals.length}</span> deals
                            {hasActiveFilters && (
                              <span className="ml-2 text-blue-600">• Filtered</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Kanban Board with filtered deals */}
                    <div className="flex-1 min-h-0">
                      <KanbanBoard
                        pipeline={pipeline}
                        deals={filteredDeals}
                        organisations={organisations}
                        contacts={contacts}
                        onDealMoved={handleDealMoved}
                        onDealUpdated={handleDealUpdated}
                        onOrganisationClick={handleOrganisationClick}
                        onContactClick={handleContactClick}
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
                <div className="text-gray-500 mb-4">No pipelines found</div>
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
      
      {/* Save Filter Dialog */}
      <Dialog open={showSaveFilter} onOpenChange={setShowSaveFilter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Current Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filterName">Filter Name *</Label>
              <Input
                id="filterName"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="e.g., High Value Deals"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && saveFilterName.trim()) {
                    saveCurrentFilter();
                  }
                }}
              />
            </div>
            
            {/* Preview of what will be saved */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-gray-700 mb-2">Filter Preview:</div>
              <div className="space-y-1 text-gray-600">
                {searchQuery && (
                  <div>Search: "{searchQuery}"</div>
                )}
                {filters.amountMin && (
                  <div>Min Amount: ${filters.amountMin}</div>
                )}
                {filters.amountMax && (
                  <div>Max Amount: ${filters.amountMax}</div>
                )}
                {filters.probability && (
                  <div>Min Probability: {filters.probability}%</div>
                )}
                {filters.organisation && (
                  <div>Organisation: {organisations.find(o => o.id === filters.organisation)?.name}</div>
                )}
                {filters.contact && (
                  <div>Contact: {contacts.find(c => c.id === filters.contact)?.firstName} {contacts.find(c => c.id === filters.contact)?.lastName}</div>
                )}
                {filters.currency && (
                  <div>Currency: {filters.currency}</div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveFilter(false)}>
                Cancel
              </Button>
              <Button onClick={saveCurrentFilter} disabled={!saveFilterName.trim()}>
                Save Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}