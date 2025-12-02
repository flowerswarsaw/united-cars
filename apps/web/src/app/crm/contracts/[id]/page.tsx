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
import { Edit2, Save, X, Building2, FileText, Calendar, ChevronRight, Trash2, User } from 'lucide-react';
import { Contract, ContractStatus, ContractType, Organisation, Deal, Contact } from '@united-cars/crm-core';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { UserSelect } from '@/components/crm/shared/user-select';
import { ContactsMultiSelect } from '@/components/crm/shared/contacts-multi-select';

// Helper function to get status badge variant
const getStatusVariant = (status: ContractStatus): "default" | "secondary" | "success" | "destructive" | "warning" | "outline" => {
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

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Section-specific editing states
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    financial: false,
    timeline: false,
    relationships: false,
    document: false,
    notes: false
  });

  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    title: '',
    type: ContractType.SERVICE,
    status: ContractStatus.DRAFT,
    description: ''
  });

  const [financialData, setFinancialData] = useState({
    amount: '',
    currency: 'USD'
  });

  const [timelineData, setTimelineData] = useState({
    effectiveDate: '',
    endDate: '',
    signedDate: '',
    sentDate: ''
  });

  const [documentData, setDocumentData] = useState({
    version: '1.0',
    fileId: ''
  });

  const [notesData, setNotesData] = useState({
    notes: ''
  });

  const [relationshipsData, setRelationshipsData] = useState({
    organisationId: '',
    contactIds: [] as string[],
    dealId: '',
    responsibleUserId: ''
  });

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      const response = await fetch(`/api/crm/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error('Contract not found');
      }
      const data = await response.json();
      setContract(data);

      // Initialize section-specific data
      setBasicInfoData({
        title: data.title || '',
        type: data.type || ContractType.SERVICE,
        status: data.status || ContractStatus.DRAFT,
        description: data.description || ''
      });

      setFinancialData({
        amount: data.amount?.toString() || '',
        currency: data.currency || 'USD'
      });

      setTimelineData({
        effectiveDate: data.effectiveDate ? format(new Date(data.effectiveDate), 'yyyy-MM-dd') : '',
        endDate: data.endDate ? format(new Date(data.endDate), 'yyyy-MM-dd') : '',
        signedDate: data.signedDate ? format(new Date(data.signedDate), 'yyyy-MM-dd') : '',
        sentDate: data.sentDate ? format(new Date(data.sentDate), 'yyyy-MM-dd') : ''
      });

      setDocumentData({
        version: data.version || '1.0',
        fileId: data.fileId || ''
      });

      setNotesData({
        notes: data.notes || ''
      });

      setRelationshipsData({
        organisationId: data.organisationId || '',
        contactIds: data.contactIds || [],
        dealId: data.dealId || '',
        responsibleUserId: data.responsibleUserId || ''
      });

      // Load all data in parallel
      const [orgsRes, dealsRes, contactsRes, orgRes, dealRes] = await Promise.all([
        fetch('/api/crm/organisations'),
        fetch('/api/crm/deals'),
        fetch('/api/crm/contacts'),
        data.organisationId ? fetch(`/api/crm/organisations/${data.organisationId}`) : null,
        data.dealId ? fetch(`/api/crm/deals/${data.dealId}`) : null
      ]);

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganisations(Array.isArray(orgsData) ? orgsData : []);
      }
      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(Array.isArray(dealsData) ? dealsData : []);
      }
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(Array.isArray(contactsData) ? contactsData : []);
      }
      if (orgRes && orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganisation(orgData);
      }
      if (dealRes && dealRes.ok) {
        const dealData = await dealRes.json();
        setDeal(dealData);
      }

    } catch (error) {
      console.error('Failed to load contract:', error);
      toast.error('Failed to load contract');
      router.push('/crm/contracts');
    } finally {
      setLoading(false);
    }
  };

  // Section-specific save handlers
  const saveSection = async (section: string, data: any) => {
    if (!contract) return;

    try {
      const response = await fetch(`/api/crm/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success('Contract updated successfully');
        loadContract();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Failed to update contract:', error);
      toast.error('Failed to update contract');
    }
  };

  // Delete contract function
  const deleteContract = async () => {
    if (!contract) return;

    if (!confirm(`Are you sure you want to delete the contract "${contract.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/contracts/${contractId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Contract deleted successfully');
        router.push('/crm/contracts');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete contract: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting contract');
      console.error('Error:', error);
    }
  };

  // Section edit buttons component
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

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader
          title="Contract Details"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Contracts', href: '/crm/contracts' }, { label: 'Details' }]}
        />
        <LoadingState text="Loading contract..." />
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout user={user}>
        <PageHeader
          title="Contract Not Found"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Contracts', href: '/crm/contracts' }]}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-muted-foreground">Contract not found</p>
            <Button onClick={() => router.push('/crm/contracts')} className="mt-4">
              Back to Contracts
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title={contract.title}
        description={contract.contractNumber}
        breadcrumbs={[
          { label: 'CRM' },
          { label: 'Contracts', href: '/crm/contracts' },
          { label: contract.contractNumber }
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Status and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge variant={getStatusVariant(contract.status)} className="text-sm px-3 py-1">
              {contract.status}
            </Badge>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground capitalize">{contract.type}</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteContract}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Contract
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Contract details</CardDescription>
                </div>
                <SectionEditButtons
                  section="basicInfo"
                  onSave={() => saveSection('basicInfo', basicInfoData)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.basicInfo ? (
                  <>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={basicInfoData.title}
                        onChange={(e) => setBasicInfoData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={basicInfoData.type}
                        onValueChange={(value) => setBasicInfoData(prev => ({ ...prev, type: value as ContractType }))}
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
                        value={basicInfoData.status}
                        onValueChange={(value) => setBasicInfoData(prev => ({ ...prev, status: value as ContractStatus }))}
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
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={basicInfoData.description}
                        onChange={(e) => setBasicInfoData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contract Number</label>
                      <p className="text-sm mt-1">
                        <code className="text-sm font-mono bg-surface-100 px-2 py-1 rounded">
                          {contract.contractNumber}
                        </code>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm mt-1 capitalize">{contract.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="text-sm mt-1">
                        <Badge variant={getStatusVariant(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                    {contract.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{contract.description}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Financial Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Financial Details</CardTitle>
                  <CardDescription>Contract value and currency</CardDescription>
                </div>
                <SectionEditButtons
                  section="financial"
                  onSave={() => saveSection('financial', {
                    amount: financialData.amount ? parseFloat(financialData.amount) : undefined,
                    currency: financialData.currency
                  })}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.financial ? (
                  <>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={financialData.amount}
                        onChange={(e) => setFinancialData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={financialData.currency}
                        onValueChange={(value) => setFinancialData(prev => ({ ...prev, currency: value }))}
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
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <p className="text-sm mt-1">
                        {contract.amount
                          ? `${contract.currency || 'USD'} ${contract.amount.toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Important dates</CardDescription>
                </div>
                <SectionEditButtons
                  section="timeline"
                  onSave={() => saveSection('timeline', {
                    effectiveDate: timelineData.effectiveDate || undefined,
                    endDate: timelineData.endDate || undefined,
                    signedDate: timelineData.signedDate || undefined,
                    sentDate: timelineData.sentDate || undefined
                  })}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.timeline ? (
                  <>
                    <div>
                      <Label htmlFor="effectiveDate">Effective Date</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={timelineData.effectiveDate}
                        onChange={(e) => setTimelineData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={timelineData.endDate}
                        onChange={(e) => setTimelineData(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sentDate">Sent Date</Label>
                      <Input
                        id="sentDate"
                        type="date"
                        value={timelineData.sentDate}
                        onChange={(e) => setTimelineData(prev => ({ ...prev, sentDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signedDate">Signed Date</Label>
                      <Input
                        id="signedDate"
                        type="date"
                        value={timelineData.signedDate}
                        onChange={(e) => setTimelineData(prev => ({ ...prev, signedDate: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {contract.effectiveDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Effective Date
                        </label>
                        <p className="text-sm mt-1">{format(new Date(contract.effectiveDate), 'PPP')}</p>
                      </div>
                    )}
                    {contract.endDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          End Date
                        </label>
                        <p className="text-sm mt-1">{format(new Date(contract.endDate), 'PPP')}</p>
                      </div>
                    )}
                    {contract.sentDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Sent Date</label>
                        <p className="text-sm mt-1">{format(new Date(contract.sentDate), 'PPP')}</p>
                      </div>
                    )}
                    {contract.signedDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
                        <p className="text-sm mt-1">{format(new Date(contract.signedDate), 'PPP')}</p>
                      </div>
                    )}
                    {!contract.effectiveDate && !contract.endDate && !contract.sentDate && !contract.signedDate && (
                      <p className="text-sm text-muted-foreground">No dates specified</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Relationships Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Relationships</CardTitle>
                  <CardDescription>Linked entities</CardDescription>
                </div>
                {!editingSections.relationships ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSections(prev => ({ ...prev, relationships: true }))}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Reset to current contract values
                        setRelationshipsData({
                          organisationId: contract?.organisationId || '',
                          contactIds: contract?.contactIds || [],
                          dealId: contract?.dealId || '',
                          responsibleUserId: contract?.responsibleUserId || ''
                        });
                        setEditingSections(prev => ({ ...prev, relationships: false }));
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSection('relationships', relationshipsData)}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.relationships ? (
                  <>
                    {/* Organisation Selector */}
                    <div>
                      <Label>Organisation *</Label>
                      <Select
                        value={relationshipsData.organisationId || undefined}
                        onValueChange={(value) => setRelationshipsData({
                          ...relationshipsData,
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
                        value={relationshipsData.contactIds}
                        onValueChange={(ids) => setRelationshipsData({
                          ...relationshipsData,
                          contactIds: ids
                        })}
                        organisationId={relationshipsData.organisationId || undefined}
                        placeholder="Select contacts from organisation..."
                        disabled={!relationshipsData.organisationId}
                      />
                    </div>

                    {/* Deal Selector */}
                    <div>
                      <Label>Deal (optional)</Label>
                      <Select
                        value={relationshipsData.dealId || "none"}
                        onValueChange={(value) => setRelationshipsData({
                          ...relationshipsData,
                          dealId: value === "none" ? '' : value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select deal (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Deal</SelectItem>
                          {deals
                            .filter(deal => !relationshipsData.organisationId ||
                                    deal.organisationId === relationshipsData.organisationId)
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
                        value={relationshipsData.responsibleUserId || undefined}
                        onValueChange={(value) => setRelationshipsData({
                          ...relationshipsData,
                          responsibleUserId: value || ''
                        })}
                        placeholder="Assign to user..."
                        includeEmpty
                        emptyLabel="Unassigned"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Read-only display */}
                    <div>
                      <Label className="text-muted-foreground text-sm">Organisation</Label>
                      {organisation ? (
                        <div
                          className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors mt-1"
                          onClick={() => router.push(`/crm/organisations/${organisation.id}`)}
                        >
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{organisation.name}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">No organisation</p>
                      )}
                    </div>

                    {contract?.contactIds && contract.contactIds.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Contacts ({contract.contactIds.length})
                        </Label>
                        <div className="space-y-2 mt-1">
                          {contacts
                            .filter(c => contract.contactIds.includes(c.id))
                            .map(contact => (
                              <div
                                key={contact.id}
                                className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/30"
                                onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                              >
                                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {contact.firstName} {contact.lastName}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {deal && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Deal</Label>
                        <div
                          className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors mt-1"
                          onClick={() => router.push(`/crm/deals/${deal.id}`)}
                        >
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">{deal.title}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-green-500 dark:text-green-400" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Document Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Document</CardTitle>
                  <CardDescription>File and version info</CardDescription>
                </div>
                <SectionEditButtons
                  section="document"
                  onSave={() => saveSection('document', documentData)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {editingSections.document ? (
                  <>
                    <div>
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={documentData.version}
                        onChange={(e) => setDocumentData(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fileId">File ID</Label>
                      <Input
                        id="fileId"
                        value={documentData.fileId}
                        onChange={(e) => setDocumentData(prev => ({ ...prev, fileId: e.target.value }))}
                        placeholder="file-123"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Version</label>
                      <p className="text-sm mt-1">{contract.version || '1.0'}</p>
                    </div>
                    {contract.fileId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">File ID</label>
                        <p className="text-sm mt-1 font-mono">{contract.fileId}</p>
                      </div>
                    )}
                    {!contract.fileId && (
                      <p className="text-sm text-muted-foreground">No file attached</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Additional information</CardDescription>
                </div>
                <SectionEditButtons
                  section="notes"
                  onSave={() => saveSection('notes', notesData)}
                />
              </CardHeader>
              <CardContent>
                {editingSections.notes ? (
                  <div>
                    <Textarea
                      value={notesData.notes}
                      onChange={(e) => setNotesData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes..."
                      rows={5}
                    />
                  </div>
                ) : (
                  <>
                    {contract.notes ? (
                      <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No notes</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Metadata Section */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>System information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(contract.createdAt), 'PPP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(contract.updatedAt), 'PPP')}</span>
                </div>
                {contract.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="font-mono text-xs">{contract.createdBy}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
