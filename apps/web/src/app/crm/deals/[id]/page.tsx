"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, Save, X, Building2, DollarSign, Calendar, User, History, CheckSquare, Plus, Trophy, AlertCircle, Clock, Circle, ChevronRight, Star, Target, TrendingUp, Users, FileText, Activity, Trash2 } from 'lucide-react';
import { Deal, Organisation, Contact, Task, Pipeline, Stage, DealStatus, TaskStatus, TaskPriority, EntityType, LossReason } from '@united-cars/crm-core';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showWonDialog, setShowWonDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);

  // Section-specific editing states (matching contact page pattern)
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    relationships: false,
    notes: false
  });

  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    title: '',
    value: '',
    currency: 'USD',
    probability: '',
    description: '',
    pipelineId: '',
    stageId: ''
  });

  const [relationshipsData, setRelationshipsData] = useState({
    organisationId: '',
    contactId: ''
  });

  const [notesData, setNotesData] = useState({
    notes: ''
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    status: TaskStatus.TODO
  });

  const [wonNote, setWonNote] = useState('');
  const [lossReason, setLossReason] = useState<LossReason | ''>('');
  const [lostNote, setLostNote] = useState('');

  useEffect(() => {
    loadDeal();
    loadRelatedData();
  }, [dealId]);

  const loadDeal = async () => {
    try {
      const response = await fetch(`/api/crm/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Deal not found');
      }
      const data = await response.json();
      setDeal(data);

      // Initialize section-specific data
      setBasicInfoData({
        title: data.title || '',
        value: data.value?.toString() || '',
        currency: data.currency || 'USD',
        probability: data.probability?.toString() || '',
        description: data.description || '',
        pipelineId: data.pipelineId || '',
        stageId: data.stageId || ''
      });

      setRelationshipsData({
        organisationId: data.organisationId || '',
        contactId: data.contactId || ''
      });

      setNotesData({
        notes: data.notes || ''
      });

      // Load pipelines and set current pipeline and stage
      const pipelineResponse = await fetch(`/api/crm/pipelines`);
      const pipelinesData = await pipelineResponse.json();
      setPipelines(pipelinesData);

      if (data.pipelineId) {
        const dealPipeline = pipelinesData.find((p: Pipeline) => p.id === data.pipelineId);
        if (dealPipeline) {
          setPipeline(dealPipeline);
          const dealStage = dealPipeline.stages?.find((s: Stage) => s.id === data.stageId);
          setStage(dealStage || null);
        }
      }

      // Load related organisation and contact
      if (data.organisationId) {
        const orgResponse = await fetch(`/api/crm/organisations/${data.organisationId}`);
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setOrganisation(orgData);
        }
      }

      if (data.contactId) {
        const contactResponse = await fetch(`/api/crm/contacts`);
        if (contactResponse.ok) {
          const contactsData = await contactResponse.json();
          const dealContact = contactsData.find((c: Contact) => c.id === data.contactId);
          setContact(dealContact || null);
        }
      }

      // Load tasks
      const tasksResponse = await fetch('/api/crm/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const dealTasks = tasksData.filter((t: Task) =>
          t.targetType === EntityType.DEAL && t.targetId === dealId
        );
        setTasks(dealTasks);
      }

    } catch (error) {
      console.error('Failed to load deal:', error);
      toast.error('Failed to load deal');
      router.push('/crm/deals');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      // Load all organisations and contacts for form selects
      const [orgsResponse, contactsResponse] = await Promise.all([
        fetch('/api/crm/organisations'),
        fetch('/api/crm/contacts')
      ]);

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganisations(orgsData);
      }

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Failed to load related data:', error);
    }
  };

  // Section-specific save handlers (matching contact page pattern)
  const saveSection = async (section: string, data: any) => {
    if (!deal) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedDeal = await response.json();
        setDeal(updatedDeal);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success('Deal updated successfully');
        // Reload to get updated relationships
        loadDeal();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update deal');
      }
    } catch (error) {
      console.error('Failed to update deal:', error);
      toast.error('Failed to update deal');
    }
  };

  // Delete deal function
  const deleteDeal = async () => {
    if (!deal) return;

    if (!confirm(`Are you sure you want to delete the deal "${deal.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Deal deleted successfully');
        router.push('/crm/deals');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete deal: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting deal');
      console.error('Error:', error);
    }
  };

  // Section edit buttons component (matching contact page pattern)
  const SectionEditButtons = ({ section, onSave }: { section: keyof typeof editingSections, onSave: () => void }) => {
    const isEditing = editingSections[section];

    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingSections(prev => ({ ...prev, [section]: false }))}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setEditingSections(prev => ({ ...prev, [section]: true }))}
      >
        <Edit2 className="h-4 w-4 mr-1" />
        Edit
      </Button>
    );
  };

  const handleMarkWon = async () => {
    if (!deal || !pipeline) return;

    const wonStage = pipeline.stages?.find(s => s.isClosing);
    if (!wonStage) {
      toast.error('No won stage found in this pipeline');
      return;
    }

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'WON',
          stageId: wonStage.id,
          pipelineId: pipeline.id,
          ...(wonNote && { wonNote })
        })
      });

      if (response.ok) {
        const updatedDeal = await response.json();
        setDeal(updatedDeal);
        setShowWonDialog(false);
        setWonNote('');
        toast.success(`🎉 Deal Won! ${updatedDeal.title} has been marked as won.`);
        loadDeal(); // Reload to get updated stage
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark deal as won');
      }
    } catch (error) {
      console.error('Failed to mark deal as won:', error);
      toast.error('Failed to mark deal as won');
    }
  };

  const handleMarkLost = async () => {
    if (!deal || !lossReason) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'LOST',
          outcome: 'lost',
          lostAt: new Date().toISOString(),
          lossReason,
          isFrozen: true,
          ...(lostNote && { lostNote })
        })
      });

      if (response.ok) {
        const updatedDeal = await response.json();
        setDeal(updatedDeal);
        setShowLostDialog(false);
        setLossReason('');
        setLostNote('');
        toast.error(`Deal Lost: ${updatedDeal.title} - ${lossReason}`);
        loadDeal(); // Reload to get updated stage
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark deal as lost');
      }
    } catch (error) {
      console.error('Failed to mark deal as lost:', error);
      toast.error('Failed to mark deal as lost');
    }
  };

  const handleCreateTask = async () => {
    if (!taskFormData.title) return;

    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskFormData.title,
          description: taskFormData.description || undefined,
          priority: taskFormData.priority,
          ...(taskFormData.dueDate && { dueDate: taskFormData.dueDate }),
          targetType: EntityType.DEAL,
          targetId: dealId,
          status: TaskStatus.TODO
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        setShowTaskDialog(false);
        setTaskFormData({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: '',
          status: TaskStatus.TODO
        });
        toast.success('Task created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'No amount set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal?.currency || 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <LoadingState />
      </AppLayout>
    );
  }

  if (!deal) {
    return (
      <AppLayout user={user}>
        <PageHeader
          title="Deal Not Found"
          description="The requested deal could not be found"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Deals', href: '/crm/deals' }, { label: 'Not Found' }]}
        />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">The deal you're looking for doesn't exist or has been deleted.</p>
          <Button className="mt-4" onClick={() => router.push('/crm/deals')}>
            Back to Deals
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title={deal.title || 'Untitled Deal'}
        description={`${pipeline && stage ? `${pipeline.name} • ${stage.name}` : 'Deal details and management'}`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Deals', href: '/crm/deals' },
          { label: deal.title || 'Deal' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/crm/deals')}
            >
              ← Back to Kanban
            </Button>

            {deal.status === DealStatus.OPEN && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowWonDialog(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Mark Won
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowLostDialog(true)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Mark Lost
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="details" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteDeal}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Basic Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Deal details and financial information</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="basicInfo"
                    onSave={() => saveSection('basicInfo', {
                      title: basicInfoData.title,
                      value: basicInfoData.value ? parseFloat(basicInfoData.value) : undefined,
                      currency: basicInfoData.currency,
                      probability: basicInfoData.probability ? parseInt(basicInfoData.probability) : undefined,
                      description: basicInfoData.description || undefined,
                      pipelineId: basicInfoData.pipelineId || undefined,
                      stageId: basicInfoData.stageId || undefined
                    })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Deal Title</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="title"
                        value={basicInfoData.title}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, title: e.target.value })}
                        placeholder="Deal title"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {deal.title || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Value</Label>
                      {editingSections.basicInfo ? (
                        <Input
                          id="value"
                          type="number"
                          value={basicInfoData.value}
                          onChange={(e) => setBasicInfoData({ ...basicInfoData, value: e.target.value })}
                          placeholder="0"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {formatCurrency(deal.value)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      {editingSections.basicInfo ? (
                        <Select value={basicInfoData.currency} onValueChange={(value) => setBasicInfoData({ ...basicInfoData, currency: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {deal.currency || 'USD'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={basicInfoData.probability}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, probability: e.target.value })}
                        placeholder="50"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {deal.probability ? `${deal.probability}%` : 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Pipeline & Stage</Label>
                    {editingSections.basicInfo ? (
                      <div className="mt-1 space-y-3">
                        <div>
                          <Label htmlFor="pipeline" className="text-xs">Pipeline</Label>
                          <Select
                            value={basicInfoData.pipelineId || "none"}
                            onValueChange={(value) => {
                              const newPipelineId = value === "none" ? '' : value;
                              setBasicInfoData({
                                ...basicInfoData,
                                pipelineId: newPipelineId,
                                stageId: '' // Reset stage when pipeline changes
                              });
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select pipeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Pipeline</SelectItem>
                              {pipelines.map((pipeline) => (
                                <SelectItem key={pipeline.id} value={pipeline.id}>
                                  {pipeline.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {basicInfoData.pipelineId && (
                          <div>
                            <Label htmlFor="stage" className="text-xs">Stage</Label>
                            <Select
                              value={basicInfoData.stageId || "none"}
                              onValueChange={(value) => setBasicInfoData({
                                ...basicInfoData,
                                stageId: value === "none" ? '' : value
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Stage</SelectItem>
                                {pipelines
                                  .find(p => p.id === basicInfoData.pipelineId)
                                  ?.stages?.map((stage) => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: stage.color || '#6B7280' }}
                                        />
                                        {stage.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 space-y-2">
                        {pipeline && stage ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color || '#6B7280' }}
                            />
                            <span className="text-sm text-gray-900">
                              {pipeline.name} → {stage.name}
                            </span>
                            <Badge
                              variant={deal.status === DealStatus.WON ? 'default' :
                                      deal.status === DealStatus.LOST ? 'destructive' : 'secondary'}
                            >
                              {deal.status}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No pipeline assigned</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    {editingSections.basicInfo ? (
                      <Textarea
                        id="description"
                        value={basicInfoData.description}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, description: e.target.value })}
                        placeholder="Deal description..."
                        rows={3}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {deal.description || 'Not specified'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Relationships Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Related Contacts</CardTitle>
                    <CardDescription>Associated organization and contact</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="relationships"
                    onSave={() => saveSection('relationships', {
                      organisationId: relationshipsData.organisationId || undefined,
                      contactId: relationshipsData.contactId || undefined
                    })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="organisation">Organisation</Label>
                    {editingSections.relationships ? (
                      <Select
                        value={relationshipsData.organisationId || "none"}
                        onValueChange={(value) => setRelationshipsData({
                          ...relationshipsData,
                          organisationId: value === "none" ? '' : value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select organisation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Organisation</SelectItem>
                          {organisations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        {organisation ? (
                          <div
                            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => router.push(`/crm/organisations/${organisation.id}`)}
                          >
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 truncate">
                                {organisation.name}
                              </p>
                              <p className="text-xs text-blue-600">
                                Click to view details
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-blue-500" />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No organisation assigned</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    {editingSections.relationships ? (
                      <Select
                        value={relationshipsData.contactId || "none"}
                        onValueChange={(value) => setRelationshipsData({
                          ...relationshipsData,
                          contactId: value === "none" ? '' : value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={
                            relationshipsData.organisationId
                              ? "Select contact from organisation"
                              : "Select any contact"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Contact</SelectItem>
                          {relationshipsData.organisationId ? (
                            // Show only contacts from selected organisation
                            contacts
                              .filter(contact => contact.organisationId === relationshipsData.organisationId)
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
                    ) : (
                      <div className="mt-1">
                        {contact ? (
                          <div
                            className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                            onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                          >
                            <User className="h-4 w-4 text-purple-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-purple-900 truncate">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-xs text-purple-600">
                                {contact.title || 'Contact'} • Click to view details
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-purple-500" />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No contact assigned</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">Created</Label>
                      <p className="text-sm text-gray-900">{formatDate(deal.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">Last Updated</Label>
                      <p className="text-sm text-gray-900">{formatDate(deal.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>Additional notes and comments</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="notes"
                    onSave={() => saveSection('notes', {
                      notes: notesData.notes || undefined
                    })}
                  />
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="notes">Deal Notes</Label>
                    {editingSections.notes ? (
                      <Textarea
                        id="notes"
                        value={notesData.notes}
                        onChange={(e) => setNotesData({ ...notesData, notes: e.target.value })}
                        placeholder="Add notes about this deal..."
                        rows={4}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {deal.notes || 'No notes added'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Tasks ({tasks.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Manage tasks and action items for this deal
                </p>
              </div>
              <Button onClick={() => setShowTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            {tasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No tasks assigned</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add tasks to track progress and stay organized
                  </p>
                  <Button onClick={() => setShowTaskDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
                  return (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center mt-1">
                            {task.status === TaskStatus.DONE ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : task.status === TaskStatus.IN_PROGRESS ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className={`font-medium text-sm leading-snug ${
                                task.status === TaskStatus.DONE ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h4>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    task.priority === TaskPriority.URGENT ? 'border-red-500 text-red-700' :
                                    task.priority === TaskPriority.HIGH ? 'border-orange-500 text-orange-700' :
                                    task.priority === TaskPriority.MEDIUM ? 'border-yellow-500 text-yellow-700' :
                                    'border-gray-500 text-gray-700'
                                  }`}
                                >
                                  {task.priority}
                                </Badge>

                                <Badge
                                  variant={
                                    task.status === TaskStatus.DONE ? 'default' :
                                    task.status === TaskStatus.IN_PROGRESS ? 'secondary' : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {task.description}
                              </p>
                            )}

                            {task.dueDate && (
                              <div className={`flex items-center gap-2 text-xs ${
                                isOverdue ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs ml-1">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-lg font-medium mb-2">Activity tracking coming soon</h4>
                <p className="text-sm text-muted-foreground">
                  Deal history and timeline will be available in the next update
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskFormData.priority}
                  onValueChange={(value) => setTaskFormData({ ...taskFormData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!taskFormData.title}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWonDialog} onOpenChange={setShowWonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Won</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wonNote">Celebration Note (Optional)</Label>
              <Textarea
                id="wonNote"
                value={wonNote}
                onChange={(e) => setWonNote(e.target.value)}
                placeholder="Add a note about this successful deal..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowWonDialog(false);
                setWonNote('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleMarkWon} className="bg-green-600 hover:bg-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Mark as Won
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lossReason">Loss Reason *</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LossReason.STOPPED_WORKING}>Stopped Working</SelectItem>
                  <SelectItem value={LossReason.COULD_NOT_REACH_DM}>Could Not Reach Decision Maker</SelectItem>
                  <SelectItem value={LossReason.REJECTION}>Rejection</SelectItem>
                  <SelectItem value={LossReason.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lostNote">Note (Optional)</Label>
              <Textarea
                id="lostNote"
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                placeholder="Add a note about why this deal was lost..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowLostDialog(false);
                setLossReason('');
                setLostNote('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleMarkLost} disabled={!lossReason}>
                Mark as Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}