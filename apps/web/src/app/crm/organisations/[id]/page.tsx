"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Save, X, Building2, MapPin, Globe, Mail, Phone, Users, DollarSign, FileText, ExternalLink, Facebook, Instagram, Twitter, Plus, Trash2, Star, Link2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { LocationFieldGroup } from '@/components/location';
import { useSession } from '@/hooks/useSession';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Organisation, Contact, Deal, OrganizationType, ContactMethod, ContactMethodType, SocialMediaLink, SocialPlatform, OrganisationConnection, TypeSpecificFieldDef, CustomFieldType, getTypeSpecificFields, ContactType, Pipeline, Stage } from '@united-cars/crm-core';
import { COUNTRIES_REGIONS, getCountryByCode, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
import { CrmBadge } from '@united-cars/ui';
import toast from 'react-hot-toast';
import { getUserName, getUserInitials, CRM_USERS } from '@/lib/crm-users';

export default function OrganisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const orgId = params.id as string;

  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [connections, setConnections] = useState<OrganisationConnection[]>([]);
  const [connectedOrgs, setConnectedOrgs] = useState<Organisation[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);

  // Connection dialog state
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [newConnection, setNewConnection] = useState({
    toOrganisationId: ''
  });

  // Contact creation dialog state
  const [isContactCreateOpen, setIsContactCreateOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    firstName: '',
    lastName: '',
    type: ContactType.SALES,
    phone: '',
    email: '',
    organisationId: orgId,
    country: '',
    state: '',
    city: ''
  });
  const [showCustomCityContact, setShowCustomCityContact] = useState(false);
  const [contactDuplicateWarning, setContactDuplicateWarning] = useState<{
    isBlocked: boolean;
    conflicts: Array<{
      type: 'email' | 'phone';
      value: string;
      existingEntity: {
        id: string;
        type: 'lead' | 'contact' | 'organisation';
        name: string;
        details?: string;
      };
    }>;
  } | null>(null);

  // Contact management dialog state
  const [isContactManageOpen, setIsContactManageOpen] = useState(false);
  const [contactManageMode, setContactManageMode] = useState<'select' | 'create'>('select');
  const [unassignedContacts, setUnassignedContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');

  // Deal creation dialog state
  const [isDealCreateOpen, setIsDealCreateOpen] = useState(false);
  const [dealFormData, setDealFormData] = useState({
    title: '',
    description: '',
    value: '',
    currency: 'USD',
    probability: '',
    stage: '',
    contactId: '',
    pipeline: ''
  });

  // Section-specific editing states (matching contact page pattern)
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    contactInfo: false,
    address: false,
    socialMedia: false,
    typeSpecific: false,
    notes: false,
    assignment: false
  });

  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    name: '',
    companyId: '',
    type: OrganizationType.DEALER,
    size: ''
  });

  const [contactInfoData, setContactInfoData] = useState({
    contactMethods: [] as ContactMethod[]
  });

  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  const [socialMediaData, setSocialMediaData] = useState({
    socialMedia: [] as SocialMediaLink[]
  });

  const [typeSpecificData, setTypeSpecificData] = useState({
    customFields: {} as Record<string, any>
  });

  const [notesData, setNotesData] = useState({
    notes: ''
  });

  const [assignmentData, setAssignmentData] = useState({
    responsibleUserId: ''
  });

  useEffect(() => {
    if (orgId) {
      fetchOrganisation();
      fetchRelatedData();
    }
  }, [orgId]);

  // Auto-generate deal title when dialog opens
  useEffect(() => {
    if (isDealCreateOpen && organisation) {
      setDealFormData(prev => ({
        ...prev,
        title: generateDealTitle()
      }));
    }
  }, [isDealCreateOpen, organisation]);

  // Duplicate checking for contact creation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkContactDuplicates(contactFormData.email || undefined, contactFormData.phone || undefined);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [contactFormData.email, contactFormData.phone]);

  const checkContactDuplicates = async (email?: string, phone?: string) => {
    if (!email && !phone) {
      setContactDuplicateWarning(null);
      return;
    }

    try {
      const contactMethods = [];
      if (email) contactMethods.push({ type: ContactMethodType.EMAIL, value: email });
      if (phone) contactMethods.push({ type: ContactMethodType.PHONE, value: phone });

      const response = await fetch('/api/crm/validate-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'contact',
          data: {
            firstName: contactFormData.firstName,
            lastName: contactFormData.lastName,
            contactMethods
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setContactDuplicateWarning(result.conflicts.length > 0 ? result : null);
      }
    } catch (error) {
      console.error('Failed to check contact duplicates:', error);
    }
  };

  const fetchOrganisation = async () => {
    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`);
      const data = await response.json();

      if (response.ok) {
        setOrganisation(data);

        // Initialize section-specific data
        setBasicInfoData({
          name: data.name || '',
          companyId: data.companyId || '',
          type: data.type || OrganizationType.DEALER,
          size: data.size || ''
        });

        setContactInfoData({
          contactMethods: data.contactMethods || []
        });

        setAddressData({
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postalCode: data.postalCode || ''
        });

        setSocialMediaData({
          socialMedia: data.socialMedia || []
        });

        setTypeSpecificData({
          customFields: data.customFields || {}
        });

        setNotesData({
          notes: data.notes || ''
        });

        setAssignmentData({
          responsibleUserId: data.responsibleUserId || ''
        });
      } else {
        toast.error(`Failed to fetch organisation: ${data.error}`);
        router.push('/crm/organisations');
      }
    } catch (error) {
      toast.error('Error fetching organisation details');
      console.error('Error:', error);
      router.push('/crm/organisations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Load all organisations for connection selection
      const allOrgsResponse = await fetch('/api/crm/organisations');
      const allOrgs = await allOrgsResponse.json();
      setAvailableOrgs(allOrgs.filter((org: Organisation) => org.id !== orgId));

      // Load all contacts
      const contactsResponse = await fetch('/api/crm/contacts');
      const contactsData = await contactsResponse.json();
      setAllContacts(contactsData);

      // Filter contacts for this organisation
      const orgContacts = contactsData.filter((c: Contact) => c.organisationId === orgId);
      setContacts(orgContacts);

      // Load deals for this organisation
      const dealsResponse = await fetch('/api/crm/deals');
      const allDeals = await dealsResponse.json();
      const orgDeals = allDeals.filter((d: Deal) => d.organisationId === orgId);
      setDeals(orgDeals);

      // Load pipelines
      const pipelinesResponse = await fetch('/api/crm/pipelines');
      const pipelinesData = await pipelinesResponse.json();
      setPipelines(pipelinesData);

      // Load organisation connections
      const connectionsResponse = await fetch(`/api/crm/organisation-connections?orgId=${orgId}`);
      const orgConnections = await connectionsResponse.json();
      setConnections(orgConnections);

      // Load connected organisation details
      if (orgConnections.length > 0) {
        const connectedOrgIds = new Set([
          ...orgConnections.map((c: OrganisationConnection) => c.fromOrganisationId),
          ...orgConnections.map((c: OrganisationConnection) => c.toOrganisationId)
        ].filter(id => id !== orgId));
        const connected = allOrgs.filter((org: Organisation) => connectedOrgIds.has(org.id));
        setConnectedOrgs(connected);
      }
    } catch (error) {
      console.error('Failed to fetch related data:', error);
    }
  };

  const loadRelatedData = async () => {
    try {
      // Filter contacts for this organisation
      const orgContacts = allContacts.filter((c: Contact) => c.organisationId === orgId);
      setContacts(orgContacts);

      // Load deals for this organisation
      const dealsResponse = await fetch('/api/crm/deals');
      const allDeals = await dealsResponse.json();
      const orgDeals = allDeals.filter((d: Deal) => d.organisationId === orgId);
      setDeals(orgDeals);

      // Load organisation connections
      const connectionsResponse = await fetch(`/api/crm/organisation-connections?orgId=${orgId}`);
      const orgConnections = await connectionsResponse.json();
      setConnections(orgConnections);

      // Load connected organisation details
      if (orgConnections.length > 0) {
        const allOrgsResponse = await fetch('/api/crm/organisations');
        const allOrgs = await allOrgsResponse.json();
        const connectedOrgIds = new Set([
          ...orgConnections.map((c: OrganisationConnection) => c.fromOrganisationId),
          ...orgConnections.map((c: OrganisationConnection) => c.toOrganisationId)
        ].filter(id => id !== orgId));
        const connected = allOrgs.filter((org: Organisation) => connectedOrgIds.has(org.id));
        setConnectedOrgs(connected);
      }
    } catch (error) {
      console.error('Failed to load related data:', error);
    }
  };

  // Section-specific save handlers (matching contact page pattern)
  const saveSection = async (section: string, data: any) => {
    if (!organisation) return;

    // Validation for basic info section
    if (section === 'basicInfo') {
      if (!data.name?.trim()) {
        toast.error('Organisation name is required');
        return;
      }
      if (!data.type) {
        toast.error('Organisation type is required');
        return;
      }
    }

    // Validation for address section
    if (section === 'address') {
      if (!data.country?.trim()) {
        toast.error('Country is required');
        return;
      }
    }

    // Validation for contact info section
    if (section === 'contactInfo') {
      // Filter out empty contact methods
      const validContactMethods = data.contactMethods?.filter((method: any) =>
        method.value?.trim()
      ) || [];

      // Update data with filtered contact methods
      data = { ...data, contactMethods: validContactMethods };
    }

    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok) {
        setOrganisation(responseData);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success('Organisation updated successfully');
        await fetchOrganisation(); // Reload to get updated data
      } else {
        toast.error(`Failed to update organisation: ${responseData.error}`);
      }
    } catch (error) {
      toast.error('Error updating organisation');
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

  const addContactMethod = () => {
    const newMethod: ContactMethod = {
      id: Date.now().toString(),
      type: ContactMethodType.EMAIL,
      value: '',
      label: ''
    };
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: [...prev.contactMethods, newMethod]
    }));
  };

  const updateContactMethod = (index: number, field: keyof ContactMethod, value: string) => {
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.map((method, i) =>
        i === index ? { ...method, [field]: value } : method
      )
    }));
  };

  const removeContactMethod = (index: number) => {
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.filter((_, i) => i !== index)
    }));
  };

  const addSocialMediaLink = () => {
    const newLink: SocialMediaLink = {
      id: Date.now().toString(),
      platform: SocialPlatform.FACEBOOK,
      url: '',
      username: ''
    };
    setSocialMediaData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, newLink]
    }));
  };

  const updateSocialMediaLink = (index: number, field: keyof SocialMediaLink, value: string) => {
    setSocialMediaData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeSocialMediaLink = (index: number) => {
    setSocialMediaData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const handleAddConnection = async () => {
    if (!newConnection.toOrganisationId) {
      toast.error('Please select an organisation');
      return;
    }

    try {
      const response = await fetch('/api/crm/organisation-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromOrganisationId: orgId,
          toOrganisationId: newConnection.toOrganisationId,
          type: 'PARTNER' // Default type, will be inferred by backend based on org types
        })
      });

      if (response.ok) {
        toast.success('Connection added successfully');
        setIsConnectionDialogOpen(false);
        setNewConnection({ toOrganisationId: '' });
        await fetchRelatedData(); // Reload connections
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add connection');
      }
    } catch (error) {
      console.error('Error adding connection:', error);
      toast.error('Error adding connection');
    }
  };

  const generateDealTitle = (): string => {
    const date = new Date();
    const shortDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });

    if (organisation) {
      return `Deal with ${organisation.name} - ${shortDate}`;
    }

    return `New Deal - ${shortDate}`;
  };

  const handleCreateDeal = async () => {
    if (!dealFormData.title || !dealFormData.pipeline || !dealFormData.stage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: dealFormData.title,
          notes: dealFormData.description || undefined,
          value: dealFormData.value ? parseFloat(dealFormData.value) : undefined,
          currency: dealFormData.currency,
          probability: dealFormData.probability ? parseInt(dealFormData.probability) : undefined,
          organisationId: orgId,
          contactId: dealFormData.contactId || undefined,
          pipelineId: dealFormData.pipeline,
          stageId: dealFormData.stage,
          status: 'ACTIVE'
        })
      });

      if (response.ok) {
        toast.success('Deal created successfully');
        setIsDealCreateOpen(false);
        setDealFormData({
          title: '',
          description: '',
          value: '',
          currency: 'USD',
          probability: '',
          stage: '',
          contactId: '',
          pipeline: ''
        });
        await fetchRelatedData(); // Reload deals
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create deal');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Error creating deal');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/organisation-connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Connection removed successfully');
        await fetchRelatedData(); // Reload connections
      } else {
        toast.error('Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Error removing connection');
    }
  };

  const handleToggleConnectionActive = async (connectionId: string, currentActiveState: boolean) => {
    try {
      const response = await fetch(`/api/crm/organisation-connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentActiveState
        })
      });

      if (response.ok) {
        toast.success(`Partnership ${!currentActiveState ? 'activated' : 'deactivated'} successfully`);
        await fetchRelatedData(); // Reload connections
      } else {
        toast.error('Failed to update partnership status');
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Error updating partnership status');
    }
  };

  const fetchUnassignedContacts = async () => {
    try {
      const response = await fetch('/api/crm/contacts');
      const allContacts = await response.json();

      // Filter contacts that don't have an organization assigned
      const unassigned = allContacts.filter((contact: Contact) => !contact.organisationId);
      setUnassignedContacts(unassigned);
    } catch (error) {
      console.error('Error fetching unassigned contacts:', error);
      toast.error('Failed to load available contacts');
    }
  };

  const handleOpenContactManage = () => {
    fetchUnassignedContacts();
    setContactManageMode('select');
    setSelectedContactId('');
    setIsContactManageOpen(true);
  };

  const handleAssignContact = async () => {
    if (!selectedContactId) {
      toast.error('Please select a contact');
      return;
    }

    try {
      const response = await fetch(`/api/crm/contacts/${selectedContactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId: orgId })
      });

      if (response.ok) {
        toast.success('Contact assigned successfully');
        setIsContactManageOpen(false);
        setSelectedContactId('');
        await fetchRelatedData(); // Reload contacts
      } else {
        toast.error('Failed to assign contact');
      }
    } catch (error) {
      console.error('Error assigning contact:', error);
      toast.error('Error assigning contact');
    }
  };

  const handleCreateNewContactInDialog = async () => {
    // Validate required fields
    if (!contactFormData.firstName || !contactFormData.lastName || !contactFormData.type || !contactFormData.phone || !contactFormData.country) {
      alert('Please fill in all required fields: First Name, Last Name, Type, Phone, and Country');
      return;
    }

    // Check for duplicates one more time before submission
    if (contactDuplicateWarning && contactDuplicateWarning.isBlocked) {
      toast.error('Cannot create contact: Phone number or email already exists');
      return;
    }

    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactFormData, organisationId: orgId })
      });

      if (response.ok) {
        setIsContactManageOpen(false);
        setContactManageMode('select');
        setContactFormData({
          firstName: '',
          lastName: '',
          type: ContactType.SALES,
          phone: '',
          email: '',
          organisationId: orgId,
          country: '',
          state: '',
          city: ''
        });
        setShowCustomCityContact(false);
        await fetchRelatedData(); // Reload contacts
        toast.success(`Contact created: ${contactFormData.firstName} ${contactFormData.lastName}`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to create contact: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Error creating contact');
    }
  };

  const handleCreateContact = async () => {
    // Validate required fields
    if (!contactFormData.firstName || !contactFormData.lastName || !contactFormData.type || !contactFormData.phone || !contactFormData.country) {
      alert('Please fill in all required fields: First Name, Last Name, Type, Phone, and Country');
      return;
    }

    // Check for duplicates one more time before submission
    if (contactDuplicateWarning && contactDuplicateWarning.isBlocked) {
      toast.error('Cannot create contact: Phone number or email already exists');
      return;
    }

    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactFormData, organisationId: orgId })
      });

      if (response.ok) {
        setIsContactCreateOpen(false);
        setContactFormData({
          firstName: '',
          lastName: '',
          type: ContactType.SALES,
          phone: '',
          email: '',
          organisationId: orgId,
          country: '',
          state: '',
          city: ''
        });
        setShowCustomCityContact(false);
        await fetchRelatedData(); // Reload contacts
        toast.success(`Contact created: ${contactFormData.firstName} ${contactFormData.lastName}`);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to create contact: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <LoadingState />
      </AppLayout>
    );
  }

  if (!organisation) {
    return (
      <AppLayout user={user}>
        <PageHeader
          title="Organisation Not Found"
          description="The requested organisation could not be found"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Organisations', href: '/crm/organisations' }, { label: 'Not Found' }]}
        />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">The organisation you're looking for doesn't exist or has been deleted.</p>
          <Button className="mt-4" onClick={() => router.push('/crm/organisations')}>
            Back to Organisations
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const activeDeals = deals.filter(d => d.status === 'OPEN').length;

  // Delete organization function
  const deleteOrganisation = async () => {
    if (!organisation) return;

    if (!confirm(`Are you sure you want to delete the organization "${organisation.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Organization deleted successfully');
        router.push('/crm/organisations');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete organization: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting organization');
      console.error('Error:', error);
    }
  };

  // Helper function to format organization type display
  const formatOrgType = (type: OrganizationType) => {
    return type.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const orgTypeLabel = formatOrgType(organisation.type);


  return (
    <AppLayout user={user}>
      <PageHeader
        title={organisation.name}
        description={`${orgTypeLabel} • ${contacts.length} contacts • ${activeDeals} active deals`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Organisations', href: '/crm/organisations' },
          { label: organisation.name }
        ]}
        actions={null}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="details" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts ({contacts.length})
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Partners ({connections.length})
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Deals ({deals.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteOrganisation}
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
                    <CardDescription>Organisation details and classification</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="basicInfo"
                    onSave={() => saveSection('basicInfo', basicInfoData)}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="companyId">Company ID</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="companyId"
                        value={basicInfoData.companyId}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, companyId: e.target.value })}
                        placeholder="e.g., ORG-001, DEALER-123"
                        className="mt-1 font-mono"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {organisation.companyId || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name">Organisation Name</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="name"
                        value={basicInfoData.name}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, name: e.target.value })}
                        placeholder="Organisation name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {organisation.name || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    {editingSections.basicInfo ? (
                      <Select
                        value={basicInfoData.type}
                        onValueChange={(value) => setBasicInfoData({ ...basicInfoData, type: value as OrganizationType })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(OrganizationType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatOrgType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {formatOrgType(organisation.type)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="size">Size</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="size"
                        value={basicInfoData.size}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, size: e.target.value })}
                        placeholder="50-100"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {organisation.size || 'Not specified'}
                      </p>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Phone numbers, emails, and contact methods</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="contactInfo"
                    onSave={() => saveSection('contactInfo', { contactMethods: contactInfoData.contactMethods })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Contact Methods</Label>
                    {editingSections.contactInfo ? (
                      <div className="mt-1 space-y-3">
                        {contactInfoData.contactMethods.map((method, index) => (
                          <div key={method.id || index} className="p-4 border rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={method.type}
                                  onValueChange={(value) => updateContactMethod(index, 'type', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={ContactMethodType.EMAIL}>Email</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE}>Phone</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  value={method.value}
                                  onChange={(e) => updateContactMethod(index, 'value', e.target.value)}
                                  placeholder={method.type === ContactMethodType.EMAIL ? 'email@example.com' : '+1 (555) 123-4567'}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Label</Label>
                                <Input
                                  value={method.label || ''}
                                  onChange={(e) => updateContactMethod(index, 'label', e.target.value)}
                                  placeholder="e.g., Work, Mobile, Direct"
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeContactMethod(index)}
                                  className="text-red-600 hover:text-red-700 w-full"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addContactMethod} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact Method
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        {organisation.contactMethods && organisation.contactMethods.length > 0 ? (
                          <div className="space-y-2">
                            {organisation.contactMethods.map((method, index) => (
                              <div key={method.id || `method-${index}`} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                                <div className="flex items-center gap-2 min-w-[80px]">
                                  {method.type === ContactMethodType.EMAIL ? (
                                    <Mail className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <Phone className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span className="text-xs font-medium text-gray-600">
                                    {method.type === ContactMethodType.EMAIL ? 'Email' : 'Phone'}
                                  </span>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-sm text-gray-900">{method.value}</span>
                                  {method.label && (
                                    <span className="text-xs text-gray-500 italic">({method.label})</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No contact methods available</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Assignment</CardTitle>
                    <CardDescription>Responsible user for this organisation</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="assignment"
                    onSave={() => saveSection('assignment', assignmentData)}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="responsibleUserId">Assigned To</Label>
                    {editingSections.assignment ? (
                      <Select
                        value={assignmentData.responsibleUserId}
                        onValueChange={(value) => setAssignmentData({ responsibleUserId: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CRM_USERS).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                                  {user.initials}
                                </div>
                                <span>{user.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        {organisation.responsibleUserId ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                              {getUserInitials(organisation.responsibleUserId)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getUserName(organisation.responsibleUserId)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {CRM_USERS[organisation.responsibleUserId]?.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">No user assigned</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Address Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>Physical location and address details</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="address"
                    onSave={() => saveSection('address', addressData)}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingSections.address ? (
                    <LocationFieldGroup
                      value={{
                        country: addressData.country,
                        state: addressData.state,
                        city: addressData.city,
                        address: addressData.address,
                        zipCode: addressData.postalCode
                      }}
                      onChange={(location) => setAddressData({
                        ...addressData,
                        country: location.country,
                        state: location.state,
                        city: location.city,
                        address: location.address || '',
                        postalCode: location.zipCode || ''
                      })}
                      showAddress={true}
                      showZipCode={true}
                      required={true}
                      layout="grid"
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Location Display */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {organisation.country ? (getCountryByCode(organisation.country)?.name || organisation.country) : 'Not specified'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="state">State/Region</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {organisation.state ? (hasRegions(organisation.country || '') ? getRegionDisplayName(organisation.country || '', organisation.state) : organisation.state) : 'Not specified'}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="city">City</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {organisation.city || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Address Details */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="address">Street Address</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {organisation.address || 'Not specified'}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <p className="text-sm text-gray-900 mt-1">
                              {organisation.postalCode || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Media Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Social Media</CardTitle>
                    <CardDescription>Social media profiles and links</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="socialMedia"
                    onSave={() => saveSection('socialMedia', { socialMedia: socialMediaData.socialMedia })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Social Media Links</Label>
                    {editingSections.socialMedia ? (
                      <div className="mt-1 space-y-3">
                        {socialMediaData.socialMedia.map((link, index) => (
                          <div key={link.id || index} className="flex gap-2 items-start">
                            <Select
                              value={link.platform}
                              onValueChange={(value) => updateSocialMediaLink(index, 'platform', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(SocialPlatform).map((platform) => (
                                  <SelectItem key={platform} value={platform}>
                                    {platform}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={link.url}
                              onChange={(e) => updateSocialMediaLink(index, 'url', e.target.value)}
                              placeholder="Profile URL"
                              className="flex-1"
                            />
                            <Input
                              value={link.username || ''}
                              onChange={(e) => updateSocialMediaLink(index, 'username', e.target.value)}
                              placeholder="Username"
                              className="w-32"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSocialMediaLink(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addSocialMediaLink}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Social Media
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        {organisation.socialMedia && organisation.socialMedia.length > 0 ? (
                          <div className="space-y-2">
                            {organisation.socialMedia.map((link, index) => (
                              <div key={link.id || index} className="flex items-center space-x-2 text-sm">
                                {link.platform === SocialPlatform.FACEBOOK && <Facebook className="h-4 w-4 text-blue-600" />}
                                {link.platform === SocialPlatform.INSTAGRAM && <Instagram className="h-4 w-4 text-pink-600" />}
                                {link.platform === SocialPlatform.TWITTER && <Twitter className="h-4 w-4 text-blue-400" />}
                                {![SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM, SocialPlatform.TWITTER].includes(link.platform) && <Globe className="h-4 w-4 text-gray-600" />}
                                <span>{link.platform}</span>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {link.username || link.url}
                                </a>
                                <ExternalLink className="h-3 w-3 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No social media links</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Type-Specific Information Card */}
              {getTypeSpecificFields(organisation.type).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Type-Specific Information</CardTitle>
                      <CardDescription>{formatOrgType(organisation.type)} specific fields</CardDescription>
                    </div>
                    <SectionEditButtons
                      section="typeSpecific"
                      onSave={() => saveSection('typeSpecific', { customFields: typeSpecificData.customFields })}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getTypeSpecificFields(organisation.type).map((field) => (
                      <div key={field.key}>
                        <Label>{field.name}</Label>
                        {editingSections.typeSpecific ? (
                          field.type === CustomFieldType.SELECT ? (
                            <Select
                              value={typeSpecificData.customFields[field.key] as string || ''}
                              onValueChange={(value) => setTypeSpecificData({
                                ...typeSpecificData,
                                customFields: { ...typeSpecificData.customFields, [field.key]: value }
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === CustomFieldType.MULTISELECT ? (
                            <div className="mt-1 space-y-2">
                              {field.options?.map((option) => {
                                const currentValues = (typeSpecificData.customFields[field.key] as string[]) || [];
                                const isSelected = currentValues.includes(option);
                                return (
                                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        let newValues: string[];
                                        if (e.target.checked) {
                                          newValues = [...currentValues, option];
                                        } else {
                                          newValues = currentValues.filter(v => v !== option);
                                        }
                                        setTypeSpecificData({
                                          ...typeSpecificData,
                                          customFields: { ...typeSpecificData.customFields, [field.key]: newValues }
                                        });
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <Input
                              value={typeSpecificData.customFields[field.key] as string || ''}
                              onChange={(e) => setTypeSpecificData({
                                ...typeSpecificData,
                                customFields: { ...typeSpecificData.customFields, [field.key]: e.target.value }
                              })}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="mt-1"
                            />
                          )
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">
                            {field.type === CustomFieldType.MULTISELECT
                              ? (organisation.customFields?.[field.key] as string[])?.join(', ') || 'Not specified'
                              : organisation.customFields?.[field.key] || 'Not specified'
                            }
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notes Card */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>Additional notes and comments</CardDescription>
                  </div>
                  <SectionEditButtons
                    section="notes"
                    onSave={() => saveSection('notes', { notes: notesData.notes })}
                  />
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="notes">Organisation Notes</Label>
                    {editingSections.notes ? (
                      <Textarea
                        id="notes"
                        value={notesData.notes}
                        onChange={(e) => setNotesData({ ...notesData, notes: e.target.value })}
                        placeholder="Add notes about this organisation..."
                        rows={4}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {organisation.notes || 'No notes added'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Contacts ({contacts.length})</h3>
                <p className="text-sm text-muted-foreground">
                  People associated with this organisation
                </p>
              </div>
              <Button onClick={handleOpenContactManage}>
                <Plus className="h-4 w-4 mr-2" />
                Manage Contacts
              </Button>
            </div>

            {contacts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No contacts found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add contacts to track people at this organisation
                  </p>
                  <Button onClick={handleOpenContactManage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map(contact => (
                  <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/crm/contacts/${contact.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-full p-2">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <div className="mb-2">
                            <CrmBadge
                              entity={{ kind: 'contact', label: contact.type ? contact.type.replace(/_/g, ' ') : undefined }}
                              size="sm"
                            />
                          </div>
                          {contact.contactMethods && contact.contactMethods.length > 0 && (
                            <div className="space-y-1">
                              {contact.contactMethods.slice(0, 2).map((method, index) => (
                                <div key={method.id || index} className="flex items-center gap-1 text-xs text-gray-600">
                                  {method.type.includes('EMAIL') ? <Mail className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                                  <span className="truncate">{method.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Business Partners ({connections.length})</h3>
                <p className="text-sm text-muted-foreground">
                  Connected organisations and business relationships
                </p>
              </div>
              <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-blue-600" />
                      Add Business Partner
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Connect {organisation?.name} with another organisation to establish a business relationship
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="connection-org" className="text-sm font-medium">Select Organisation</Label>
                      <Select
                        value={newConnection.toOrganisationId}
                        onValueChange={(value) => setNewConnection({ toOrganisationId: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose an organisation..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                          {availableOrgs
                            .filter(org => !connectedOrgs.some(c => c.id === org.id))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{org.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatOrgType(org.type)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {availableOrgs.filter(org => !connectedOrgs.some(c => c.id === org.id)).length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          All available organisations are already connected
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsConnectionDialogOpen(false);
                          setNewConnection({ toOrganisationId: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddConnection}
                        disabled={!newConnection.toOrganisationId}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add Partner
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {connections.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No partners yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with other organisations to establish business relationships
                  </p>
                  <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Partner
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Organization Type Filter */}
                <div className="flex items-center gap-3 pb-4">
                  <Label className="text-sm font-medium text-gray-700">Filter by type:</Label>
                  <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations ({connections.length})</SelectItem>
                      {Array.from(new Set(connectedOrgs.map(org => org.type))).map(type => {
                        const count = connections.filter(c => {
                          const relatedOrg = connectedOrgs.find(org => org.id === (c.fromOrganisationId === orgId ? c.toOrganisationId : c.fromOrganisationId));
                          return relatedOrg?.type === type;
                        }).length;
                        return (
                          <SelectItem key={type} value={type}>
                            {formatOrgType(type)} ({count})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {connections
                  .filter(connection => {
                    if (partnerFilter === 'all') return true;
                    const relatedOrg = connectedOrgs.find(org => org.id === (connection.fromOrganisationId === orgId ? connection.toOrganisationId : connection.fromOrganisationId));
                    return relatedOrg?.type === partnerFilter;
                  })
                  .sort((a, b) => {
                    const orgA = connectedOrgs.find(org => org.id === (a.fromOrganisationId === orgId ? a.toOrganisationId : a.fromOrganisationId));
                    const orgB = connectedOrgs.find(org => org.id === (b.fromOrganisationId === orgId ? b.toOrganisationId : b.fromOrganisationId));
                    return (orgA?.name || '').localeCompare(orgB?.name || '');
                  })
                  .map((connection) => {
                  const relatedOrg = connectedOrgs.find(
                    org => org.id === (connection.fromOrganisationId === orgId
                      ? connection.toOrganisationId
                      : connection.fromOrganisationId)
                  );

                  if (!relatedOrg) return null;

                  return (
                    <Card key={connection.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/crm/organisations/${relatedOrg.id}`)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              connection.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {connection.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConnection(connection.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-medium text-sm mb-1">{relatedOrg.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatOrgType(relatedOrg.type)}
                        </p>
                        {relatedOrg.city && relatedOrg.country && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {relatedOrg.city}, {relatedOrg.country}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            Partnership Status
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {connection.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <Switch
                              checked={connection.isActive}
                              onCheckedChange={(checked) => {
                                handleToggleConnectionActive(connection.id, connection.isActive);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Deals ({deals.length})</h3>
                <p className="text-sm text-muted-foreground">
                  {totalDealsValue > 0 && `Total value: ${formatCurrency(totalDealsValue)} • `}
                  {activeDeals} active deals
                </p>
              </div>
              <Button onClick={() => setIsDealCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </div>

            {deals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No deals found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create deals to track sales opportunities with this organisation
                  </p>
                  <Button onClick={() => setIsDealCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Deal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deals.map(deal => (
                  <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/crm/deals/${deal.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {deal.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {deal.value && (
                                <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(deal.value)}
                                </span>
                              )}
                              <Badge
                                variant={deal.status === 'WON' ? 'default' :
                                        deal.status === 'LOST' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {deal.status}
                              </Badge>
                            </div>
                          </div>

                          {deal.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {deal.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {deal.probability && (
                              <span>{deal.probability}% probability</span>
                            )}
                            <span>Created {new Date(deal.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-lg font-medium mb-2">Activity tracking coming soon</h4>
                <p className="text-sm text-muted-foreground">
                  Organisation activity history and timeline will be available in the next update
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Management Dialog */}
      <Dialog open={isContactManageOpen} onOpenChange={setIsContactManageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {contactManageMode === 'select'
                ? `Add Contact to ${organisation?.name}`
                : `Create New Contact for ${organisation?.name}`
              }
            </DialogTitle>
          </DialogHeader>

          {contactManageMode === 'select' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Select an existing contact to assign to this organization
                </p>
                <Button
                  variant="outline"
                  onClick={() => setContactManageMode('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Contact
                </Button>
              </div>

              {unassignedContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-medium mb-2">No unassigned contacts found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    All contacts are already assigned to organizations.
                  </p>
                  <Button onClick={() => setContactManageMode('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unassignedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedContactId === contact.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <CrmBadge
                              entity={{ kind: 'contact', label: contact.type?.replace(/_/g, ' ') }}
                              size="sm"
                            />
                            {contact.title && (
                              <span className="text-sm text-muted-foreground">
                                • {contact.title}
                              </span>
                            )}
                          </div>
                          {contact.contactMethods && contact.contactMethods.length > 0 && (
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              {contact.contactMethods.filter(m => m.type.includes('EMAIL')).slice(0, 1).map(method => (
                                <span key={method.id} className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {method.value}
                                </span>
                              ))}
                              {contact.contactMethods.filter(m => m.type.includes('PHONE')).slice(0, 1).map(method => (
                                <span key={method.id} className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {method.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedContactId === contact.id && (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {unassignedContacts.length > 0 && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsContactManageOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignContact}
                    disabled={!selectedContactId}
                  >
                    Assign Contact
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Create a new contact for this organization
                </p>
                <Button
                  variant="outline"
                  onClick={() => setContactManageMode('select')}
                >
                  Back to Selection
                </Button>
              </div>

              <div className="grid gap-4 py-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      value={contactFormData.firstName}
                      onChange={(e) => setContactFormData({ ...contactFormData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      value={contactFormData.lastName}
                      onChange={(e) => setContactFormData({ ...contactFormData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Contact Type <span className="text-red-500">*</span></Label>
                  <Select value={contactFormData.type || undefined} onValueChange={(value) => setContactFormData({ ...contactFormData, type: value as ContactType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContactType.ACCOUNTING}>Accounting</SelectItem>
                      <SelectItem value={ContactType.ADMINISTRATION}>Administration</SelectItem>
                      <SelectItem value={ContactType.CEO}>CEO</SelectItem>
                      <SelectItem value={ContactType.FINANCE}>Finance</SelectItem>
                      <SelectItem value={ContactType.LOGISTICS}>Logistics</SelectItem>
                      <SelectItem value={ContactType.MARKETING}>Marketing</SelectItem>
                      <SelectItem value={ContactType.OPERATIONS}>Operations</SelectItem>
                      <SelectItem value={ContactType.PURCHASING}>Purchasing</SelectItem>
                      <SelectItem value={ContactType.RETAIL_BUYER}>Retail Buyer</SelectItem>
                      <SelectItem value={ContactType.SALES}>Sales</SelectItem>
                      <SelectItem value={ContactType.VP}>VP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                      placeholder="+1-555-0100"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                </div>

                {/* Duplicate Warning */}
                {contactDuplicateWarning && contactDuplicateWarning.conflicts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          Duplicate Found - Cannot Create Contact
                        </h4>
                        <div className="space-y-2">
                          {contactDuplicateWarning.conflicts.map((conflict, index) => (
                            <div key={index} className="text-sm text-red-700">
                              <strong>{conflict.type.toUpperCase()}:</strong> {conflict.value} already exists for{' '}
                              <span className="font-medium">
                                {conflict.existingEntity.name}
                              </span>
                              {conflict.existingEntity.details && (
                                <span className="text-red-600"> ({conflict.existingEntity.details})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Organisation */}
                <div>
                  <Label htmlFor="organisationId">Organisation</Label>
                  <Input
                    id="organisationId"
                    value={organisation?.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact will be automatically assigned to this organisation</p>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                    <Select
                      value={contactFormData.country}
                      onValueChange={(value) => setContactFormData({ ...contactFormData, country: value, state: '', city: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {COUNTRIES_REGIONS.countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State/Region</Label>
                      <Select
                        value={contactFormData.state}
                        onValueChange={(value) => setContactFormData({ ...contactFormData, state: value, city: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state/region..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getRegionsByCountryCode(contactFormData.country).map((region) => (
                            <SelectItem key={region.code} value={region.code}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      {getCitiesByRegion(contactFormData.country, contactFormData.state).length > 0 ? (
                        <>
                          <Select
                            value={showCustomCityContact ? '__custom__' : contactFormData.city}
                            onValueChange={(value) => {
                              if (value === '__custom__') {
                                setShowCustomCityContact(true);
                                setContactFormData({ ...contactFormData, city: '' });
                              } else {
                                setShowCustomCityContact(false);
                                setContactFormData({ ...contactFormData, city: value });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select city..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getCitiesByRegion(contactFormData.country, contactFormData.state).map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                              <SelectItem value="__custom__">Other/Custom city...</SelectItem>
                            </SelectContent>
                          </Select>
                          {showCustomCityContact && (
                            <Input
                              id="city"
                              value={contactFormData.city}
                              onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                              placeholder="Enter city name..."
                              className="mt-2"
                            />
                          )}
                        </>
                      ) : (
                        <Input
                          id="city"
                          value={contactFormData.city}
                          onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                          placeholder="Enter city name..."
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setContactManageMode('select')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateNewContactInDialog}
                    disabled={
                      !contactFormData.firstName ||
                      !contactFormData.lastName ||
                      !contactFormData.type ||
                      !contactFormData.phone ||
                      !contactFormData.country ||
                      (contactDuplicateWarning && contactDuplicateWarning.isBlocked)
                    }
                  >
                    Create Contact
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Creation Dialog */}
      <Dialog open={isContactCreateOpen} onOpenChange={setIsContactCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Contact for {organisation?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={contactFormData.firstName}
                  onChange={(e) => setContactFormData({ ...contactFormData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={contactFormData.lastName}
                  onChange={(e) => setContactFormData({ ...contactFormData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Contact Type <span className="text-red-500">*</span></Label>
              <Select value={contactFormData.type || undefined} onValueChange={(value) => setContactFormData({ ...contactFormData, type: value as ContactType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContactType.ACCOUNTING}>Accounting</SelectItem>
                  <SelectItem value={ContactType.ADMINISTRATION}>Administration</SelectItem>
                  <SelectItem value={ContactType.CEO}>CEO</SelectItem>
                  <SelectItem value={ContactType.FINANCE}>Finance</SelectItem>
                  <SelectItem value={ContactType.LOGISTICS}>Logistics</SelectItem>
                  <SelectItem value={ContactType.MARKETING}>Marketing</SelectItem>
                  <SelectItem value={ContactType.OPERATIONS}>Operations</SelectItem>
                  <SelectItem value={ContactType.PURCHASING}>Purchasing</SelectItem>
                  <SelectItem value={ContactType.RETAIL_BUYER}>Retail Buyer</SelectItem>
                  <SelectItem value={ContactType.SALES}>Sales</SelectItem>
                  <SelectItem value={ContactType.VP}>VP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={contactFormData.phone}
                  onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                  placeholder="+1-555-0100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactFormData.email}
                  onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                  placeholder="john.doe@company.com"
                />
              </div>
            </div>

            {/* Duplicate Warning */}
            {contactDuplicateWarning && contactDuplicateWarning.conflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      Duplicate Found - Cannot Create Contact
                    </h4>
                    <div className="space-y-2">
                      {contactDuplicateWarning.conflicts.map((conflict, index) => (
                        <div key={index} className="text-sm text-red-700">
                          <strong>{conflict.type.toUpperCase()}:</strong> {conflict.value} already exists for{' '}
                          <span className="font-medium">
                            {conflict.existingEntity.name}
                          </span>
                          {conflict.existingEntity.details && (
                            <span className="text-red-600"> ({conflict.existingEntity.details})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organisation */}
            <div>
              <Label htmlFor="organisationId">Organisation</Label>
              <Input
                id="organisationId"
                value={organisation?.name || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Contact will be automatically assigned to this organisation</p>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                <Select
                  value={contactFormData.country}
                  onValueChange={(value) => setContactFormData({ ...contactFormData, country: value, state: '', city: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {COUNTRIES_REGIONS.countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State/Region</Label>
                  <Select
                    value={contactFormData.state}
                    onValueChange={(value) => setContactFormData({ ...contactFormData, state: value, city: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state/region..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getRegionsByCountryCode(contactFormData.country).map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  {getCitiesByRegion(contactFormData.country, contactFormData.state).length > 0 ? (
                    <>
                      <Select
                        value={showCustomCityContact ? '__custom__' : contactFormData.city}
                        onValueChange={(value) => {
                          if (value === '__custom__') {
                            setShowCustomCityContact(true);
                            setContactFormData({ ...contactFormData, city: '' });
                          } else {
                            setShowCustomCityContact(false);
                            setContactFormData({ ...contactFormData, city: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getCitiesByRegion(contactFormData.country, contactFormData.state).map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">Other/Custom city...</SelectItem>
                        </SelectContent>
                      </Select>
                      {showCustomCityContact && (
                        <Input
                          id="city"
                          value={contactFormData.city}
                          onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                          placeholder="Enter city name..."
                          className="mt-2"
                        />
                      )}
                    </>
                  ) : (
                    <Input
                      id="city"
                      value={contactFormData.city}
                      onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                      placeholder="Enter city name..."
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsContactCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateContact}
                disabled={
                  !contactFormData.firstName ||
                  !contactFormData.lastName ||
                  !contactFormData.type ||
                  !contactFormData.phone ||
                  !contactFormData.country ||
                  (contactDuplicateWarning && contactDuplicateWarning.isBlocked)
                }
              >
                Create Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Creation Dialog */}
      <Dialog open={isDealCreateOpen} onOpenChange={setIsDealCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Organization:</span>
                <span>{organisation?.name}</span>
                {organisation?.type && (
                  <CrmBadge
                    entity={{ kind: 'org', type: organisation.type.toLowerCase() }}
                    size="sm"
                  />
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="deal-title">Deal Title *</Label>
                <Input
                  id="deal-title"
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData({ ...dealFormData, title: e.target.value })}
                  placeholder="Enter deal title..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deal-value">Deal Value</Label>
                <Input
                  id="deal-value"
                  type="number"
                  value={dealFormData.value}
                  onChange={(e) => setDealFormData({ ...dealFormData, value: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deal-currency">Currency</Label>
                <Select
                  value={dealFormData.currency}
                  onValueChange={(value) => setDealFormData({ ...dealFormData, currency: value })}
                >
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="deal-probability">Probability (%)</Label>
                <Input
                  id="deal-probability"
                  type="number"
                  min="0"
                  max="100"
                  value={dealFormData.probability}
                  onChange={(e) => setDealFormData({ ...dealFormData, probability: e.target.value })}
                  placeholder="50"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deal-pipeline">Pipeline *</Label>
                <Select
                  value={dealFormData.pipeline}
                  onValueChange={(value) => setDealFormData({ ...dealFormData, pipeline: value, stage: '' })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deal-stage">Stage *</Label>
                <Select
                  value={dealFormData.stage}
                  onValueChange={(value) => setDealFormData({ ...dealFormData, stage: value })}
                  disabled={!dealFormData.pipeline}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={dealFormData.pipeline ? "Select stage" : "Select pipeline first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines
                      .find((p) => p.id === dealFormData.pipeline)
                      ?.stages?.sort((a, b) => a.order - b.order)
                      .map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="deal-contact">Contact</Label>
              <Select
                value={dealFormData.contactId}
                onValueChange={(value) => setDealFormData({ ...dealFormData, contactId: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deal-description">Description</Label>
              <Textarea
                id="deal-description"
                value={dealFormData.description}
                onChange={(e) => setDealFormData({ ...dealFormData, description: e.target.value })}
                placeholder="Enter deal description..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDealCreateOpen(false);
                  setDealFormData({
                    title: '',
                    description: '',
                    value: '',
                    currency: 'USD',
                    probability: '',
                    stage: '',
                    contactId: '',
                    pipeline: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateDeal}>
                Create Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}