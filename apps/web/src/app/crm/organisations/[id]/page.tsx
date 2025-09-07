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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Edit2, Save, X, Building2, MapPin, Globe, Mail, Phone, Hash, Calendar, Users, DollarSign, FileText, ExternalLink, Link, Facebook, Instagram, Twitter, Plus, Trash2 } from 'lucide-react';
import { Organisation, Contact, Deal, OrganizationType, ORGANIZATION_TYPE_CONFIGS, ContactMethod, ContactMethodType, SocialMediaLink, SocialPlatform, OrganisationConnection } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

export default function OrganisationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const orgId = params.id as string;
  
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [connections, setConnections] = useState<OrganisationConnection[]>([]);
  const [connectedOrgs, setConnectedOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Section-specific editing states
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    typeSpecific: false,
    contactMethods: false,
    socialMedia: false,
    connections: false,
    address: false,
    notes: false
  });
  
  const [showTypeChangeConfirm, setShowTypeChangeConfirm] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<OrganizationType | null>(null);
  
  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    name: '',
    companyId: '',
    type: OrganizationType.RETAIL_CLIENT,
    website: '',
    industry: '',
    size: ''
  });
  
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });
  
  const [notesData, setNotesData] = useState({
    notes: ''
  });
  
  const [typeSpecificData, setTypeSpecificData] = useState({} as Record<string, any>);
  
  const [contactMethodsData, setContactMethodsData] = useState<ContactMethod[]>([]);
  const [socialMediaData, setSocialMediaData] = useState<SocialMediaLink[]>([]);
  const [connectionsData, setConnectionsData] = useState<OrganisationConnection[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<Organisation[]>([]);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnectionOrgId, setNewConnectionOrgId] = useState('');

  useEffect(() => {
    loadOrganisation();
    loadRelatedData();
  }, [orgId]);

  const loadOrganisation = async () => {
    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`);
      if (!response.ok) {
        throw new Error('Organisation not found');
      }
      const data = await response.json();
      setOrganisation(data);
      
      // Initialize section-specific data
      setBasicInfoData({
        name: data.name || '',
        companyId: data.companyId || '',
        type: data.type || OrganizationType.RETAIL_CLIENT,
        website: data.website || '',
        industry: data.industry || '',
        size: data.size || ''
      });
      
      setAddressData({
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postalCode: data.postalCode || ''
      });
      
      setNotesData({
        notes: data.notes || ''
      });
      
      setTypeSpecificData(data.typeSpecificData || {});
      
      setContactMethodsData(data.contactMethods || []);
      setSocialMediaData(data.socialMedia || []);
      
      // Load all organisations for connection selection
      const allOrgsResponse = await fetch('/api/crm/organisations');
      const allOrgs = await allOrgsResponse.json();
      setAvailableOrgs(allOrgs.filter((org: Organisation) => org.id !== orgId));
    } catch (error) {
      console.error('Failed to load organisation:', error);
      toast.error('Failed to load organisation');
      router.push('/crm/organisations');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      // Load contacts for this organisation
      const contactsResponse = await fetch('/api/crm/contacts');
      const allContacts = await contactsResponse.json();
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
      setConnectionsData(orgConnections);

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

  // Section-specific save handlers
  const saveSection = async (section: string, data: any) => {
    if (!organisation) return;

    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updated = await response.json();
        setOrganisation(updated);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`);
        
        // Special handling for type changes
        if (section === 'basicInfo' && data.type !== organisation.type) {
          toast.info('Type-specific data has been cleared due to organization type change');
          setTypeSpecificData({});
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to update (${response.status})`);
      }
    } catch (error: any) {
      console.error(`Failed to update ${section}:`, error);
      toast.error(error.message || `Failed to update ${section}`);
    }
  };

  // Section-specific cancel handlers
  const cancelSection = (section: string) => {
    if (!organisation) return;
    
    switch (section) {
      case 'basicInfo':
        setBasicInfoData({
          name: organisation.name || '',
          companyId: organisation.companyId || '',
          type: organisation.type || OrganizationType.RETAIL_CLIENT,
          website: organisation.website || '',
          industry: organisation.industry || '',
          size: organisation.size || ''
        });
        break;
      case 'address':
        setAddressData({
          address: organisation.address || '',
          city: organisation.city || '',
          state: organisation.state || '',
          country: organisation.country || '',
          postalCode: organisation.postalCode || ''
        });
        break;
      case 'notes':
        setNotesData({
          notes: organisation.notes || ''
        });
        break;
      case 'typeSpecific':
        setTypeSpecificData(organisation.typeSpecificData || {});
        break;
      case 'contactMethods':
        setContactMethodsData(organisation.contactMethods || []);
        break;
      case 'socialMedia':
        setSocialMediaData(organisation.socialMedia || []);
        break;
      case 'connections':
        setConnectionsData(connections);
        setShowAddConnection(false);
        setNewConnectionOrgId('');
        break;
    }
    
    setEditingSections(prev => ({ ...prev, [section]: false }));
    setShowTypeChangeConfirm(false);
    setPendingTypeChange(null);
  };

  const handleTypeChange = (newType: OrganizationType) => {
    // If the type is different from current type and there's type-specific data, show confirmation
    if (organisation && newType !== organisation.type && organisation.typeSpecificData && Object.keys(organisation.typeSpecificData).length > 0) {
      setPendingTypeChange(newType);
      setShowTypeChangeConfirm(true);
    } else {
      // No type-specific data to lose, change directly and initialize new type's data
      const newFields = getFieldsForType(newType);
      const initialTypeData: Record<string, any> = {};
      
      // Initialize with default values for new type
      if (newFields && newFields.length > 0) {
        newFields.forEach(field => {
          if (field.type === 'MULTISELECT') {
            initialTypeData[field.key] = [];
          } else {
            initialTypeData[field.key] = '';
          }
        });
      }
      
      setBasicInfoData({ 
        ...basicInfoData, 
        type: newType
      });
      setTypeSpecificData(initialTypeData);
    }
  };

  const confirmTypeChange = () => {
    if (pendingTypeChange) {
      // Initialize type-specific data for new type
      const newFields = getFieldsForType(pendingTypeChange);
      const initialTypeData: Record<string, any> = {};
      
      if (newFields && newFields.length > 0) {
        newFields.forEach(field => {
          if (field.type === 'MULTISELECT') {
            initialTypeData[field.key] = [];
          } else {
            initialTypeData[field.key] = '';
          }
        });
      }
      
      setBasicInfoData({ 
        ...basicInfoData, 
        type: pendingTypeChange
      });
      setTypeSpecificData(initialTypeData);
      setShowTypeChangeConfirm(false);
      setPendingTypeChange(null);
      toast.success('Organization type changed. Type-specific data will be cleared on save.');
    }
  };

  const cancelTypeChange = () => {
    setShowTypeChangeConfirm(false);
    setPendingTypeChange(null);
  };

  const updateTypeSpecificData = (key: string, value: any) => {
    setTypeSpecificData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFieldsForType = (type: OrganizationType) => {
    try {
      const config = ORGANIZATION_TYPE_CONFIGS[type];
      return config && config.customFields ? config.customFields : [];
    } catch (error) {
      console.warn(`No configuration found for organization type: ${type}`);
      return [];
    }
  };

  const renderTypeSpecificField = (field: any, isEditing: boolean) => {
    const currentValue = typeSpecificData[field.key] || '';
    
    if (!isEditing) {
      let displayValue = currentValue;
      if (Array.isArray(currentValue)) {
        displayValue = currentValue.join(', ');
      } else if (typeof currentValue === 'object' && currentValue !== null) {
        displayValue = JSON.stringify(currentValue, null, 2);
      } else {
        displayValue = String(currentValue);
      }
      return (
        <div key={field.key}>
          <Label className="text-sm font-medium text-gray-700">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
            {displayValue || 'Not specified'}
          </p>
        </div>
      );
    }

    // Editing mode - render form fields based on field type
    switch (field.type) {
      case 'TEXT':
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              value={currentValue}
              onChange={(e) => updateTypeSpecificData(field.key, e.target.value)}
              placeholder={field.placeholder || field.name}
              className="mt-1"
            />
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={currentValue}
              onChange={(e) => updateTypeSpecificData(field.key, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder || field.name}
              className="mt-1"
            />
          </div>
        );

      case 'SELECT':
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => updateTypeSpecificData(field.key, value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={`Select ${field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'MULTISELECT':
        return (
          <div key={field.key}>
            <Label className="text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="mt-1 space-y-2">
              {field.options?.map((option: string) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(currentValue || []).includes(option)}
                    onChange={(e) => {
                      const currentArray = currentValue || [];
                      const newArray = e.target.checked
                        ? [...currentArray, option]
                        : currentArray.filter((item: string) => item !== option);
                      updateTypeSpecificData(field.key, newArray);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              value={currentValue}
              onChange={(e) => updateTypeSpecificData(field.key, e.target.value)}
              placeholder={field.placeholder || field.name}
              className="mt-1"
            />
          </div>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return <Facebook className="h-4 w-4" />;
      case SocialPlatform.INSTAGRAM:
        return <Instagram className="h-4 w-4" />;
      case SocialPlatform.TWITTER:
        return <Twitter className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };


  const getContactMethodIcon = (type: ContactMethodType) => {
    switch (type) {
      case ContactMethodType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ContactMethodType.PHONE:
        return <Phone className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatContactMethod = (method: ContactMethod) => {
    let typeLabel = method.type.toLowerCase();
    if (method.subtype) {
      typeLabel += ` (${method.subtype.toLowerCase()})`;
    }
    if (method.label) {
      typeLabel += ` - ${method.label}`;
    }
    return typeLabel;
  };

  const addEmail = () => {
    const newEmail: ContactMethod = {
      id: `temp_${Date.now()}`,
      type: ContactMethodType.EMAIL,
      value: '',
      label: ''
    };
    setContactMethodsData([...contactMethodsData, newEmail]);
  };

  const addPhone = () => {
    const newPhone: ContactMethod = {
      id: `temp_${Date.now()}`,
      type: ContactMethodType.PHONE,
      value: '',
      label: ''
    };
    setContactMethodsData([...contactMethodsData, newPhone]);
  };

  const updateContactMethod = (id: string, updates: Partial<ContactMethod>) => {
    setContactMethodsData(prev => prev.map(method => 
      method.id === id ? { ...method, ...updates } : method
    ));
  };

  const removeContactMethod = (id: string) => {
    setContactMethodsData(prev => prev.filter(method => method.id !== id));
  };

  const addSocialMedia = () => {
    const newSocial: SocialMediaLink = {
      id: `temp_${Date.now()}`,
      platform: SocialPlatform.FACEBOOK,
      url: '',
      isActive: true
    };
    setSocialMediaData([...socialMediaData, newSocial]);
  };

  const updateSocialMedia = (id: string, updates: Partial<SocialMediaLink>) => {
    setSocialMediaData(prev => prev.map(social => 
      social.id === id ? { ...social, ...updates } : social
    ));
  };

  const removeSocialMedia = (id: string) => {
    setSocialMediaData(prev => prev.filter(social => social.id !== id));
  };

  const addConnection = async () => {
    if (!newConnectionOrgId || !organisation) return;
    
    try {
      const response = await fetch('/api/crm/organisation-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromOrganisationId: orgId,
          toOrganisationId: newConnectionOrgId,
          type: 'PARTNER' // Default type, will be inferred from company types
        })
      });
      
      if (response.ok) {
        const newConnection = await response.json();
        setConnectionsData([...connectionsData, newConnection]);
        setNewConnectionOrgId('');
        setShowAddConnection(false);
        toast.success('Connection added successfully');
        // Refresh connected orgs list
        loadRelatedData();
      } else {
        throw new Error('Failed to create connection');
      }
    } catch (error) {
      toast.error('Failed to add connection');
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/crm/organisation-connections/${connectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setConnectionsData(prev => prev.filter(conn => conn.id !== connectionId));
        toast.success('Connection removed successfully');
        // Refresh connected orgs list
        loadRelatedData();
      } else {
        throw new Error('Failed to remove connection');
      }
    } catch (error) {
      toast.error('Failed to remove connection');
    }
  };

  const getRelationshipDescription = (fromType: string, toType: string) => {
    // Infer relationship from organization types
    if (fromType === 'DEALER' && toType === 'SHIPPER') return 'Shipping partner';
    if (fromType === 'SHIPPER' && toType === 'DEALER') return 'Dealer client';
    if (fromType === 'AUCTION' && toType === 'DEALER') return 'Buyer';
    if (fromType === 'DEALER' && toType === 'AUCTION') return 'Auction partner';
    if (fromType === 'EXPEDITOR' && toType === 'SHIPPER') return 'Service provider';
    if (fromType === 'SHIPPER' && toType === 'EXPEDITOR') return 'Expedition partner';
    return 'Business partner';
  };

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading organisation details..." />
        </div>
      </AppLayout>
    );
  }

  if (!organisation) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Organisation not found</h2>
            <Button 
              variant="outline" 
              onClick={() => router.push('/crm/organisations')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organisations
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const activeDeals = deals.filter(d => d.status === 'OPEN').length;
  const wonDeals = deals.filter(d => d.status === 'WON').length;

  // Section-specific edit button components
  const SectionEditButtons = ({ section, onSave }: { section: keyof typeof editingSections, onSave: () => void }) => (
    <div className="flex gap-2">
      {editingSections[section] ? (
        <>
          <Button onClick={onSave} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" onClick={() => cancelSection(section)} size="sm">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setEditingSections(prev => ({ ...prev, [section]: true }))} 
          size="sm"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  const orgTypeLabel = organisation.type.toLowerCase().replace('_', ' ');
  const orgDescription = [orgTypeLabel, organisation.industry].filter(Boolean).join(' • ') || 'Organisation details';

  return (
    <AppLayout user={user}>
      <PageHeader
        title={organisation.name}
        description={orgDescription}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Organisations', href: '/crm/organisations' },
          { label: organisation.name }
        ]}
        actions={null}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold">{activeDeals}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won Deals</p>
                <p className="text-2xl font-bold text-green-600">{wonDeals}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalDealsValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Organisation Information</CardTitle>
                <CardDescription>Basic information about the organisation</CardDescription>
              </div>
              <SectionEditButtons 
                section="basicInfo" 
                onSave={() => saveSection('basicInfo', { 
                  ...basicInfoData,
                  typeSpecificData: basicInfoData.type !== organisation.type ? {} : typeSpecificData 
                })}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Organisation Name</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="name"
                      value={basicInfoData.name}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{organisation.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyId">Company ID</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="companyId"
                      value={basicInfoData.companyId}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, companyId: e.target.value })}
                      placeholder="COMP-001"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {organisation.companyId || 'Not specified'}
                      </code>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Organization Type</Label>
                  {editingSections.basicInfo ? (
                    <Select
                      value={basicInfoData.type}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OrganizationType.RETAIL_CLIENT}>Retail Client</SelectItem>
                        <SelectItem value={OrganizationType.DEALER}>Dealer</SelectItem>
                        <SelectItem value={OrganizationType.EXPEDITOR}>Expeditor</SelectItem>
                        <SelectItem value={OrganizationType.SHIPPER}>Shipper</SelectItem>
                        <SelectItem value={OrganizationType.TRANSPORTER}>Transporter</SelectItem>
                        <SelectItem value={OrganizationType.AUCTION}>Auction House</SelectItem>
                        <SelectItem value={OrganizationType.PROCESSOR}>Processor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-900 mt-1 capitalize">
                      {organisation.type.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="industry"
                      value={basicInfoData.industry}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, industry: e.target.value })}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.industry || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="size">Company Size</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="size"
                      value={basicInfoData.size}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, size: e.target.value })}
                      placeholder="e.g., 1-10, 50-100, 1000+"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.size || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      id="website"
                      value={basicInfoData.website}
                      onChange={(e) => setBasicInfoData({ ...basicInfoData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.website ? (
                        <a
                          href={organisation.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {organisation.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type-Specific Information */}
          {(() => {
            const fields = getFieldsForType(basicInfoData.type);
            if (!fields || fields.length === 0) return null;
            
            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="capitalize">
                      {basicInfoData.type.toLowerCase().replace('_', ' ')} Information
                    </CardTitle>
                    <CardDescription>
                      Type-specific details for this {basicInfoData.type.toLowerCase().replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <SectionEditButtons 
                    section="typeSpecific" 
                    onSave={() => saveSection('typeSpecific', { typeSpecificData })}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(field => renderTypeSpecificField(field, editingSections.typeSpecific))
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Multiple Contact Methods */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Contact Methods</CardTitle>
                <CardDescription>All contact methods for this organisation</CardDescription>
              </div>
              <SectionEditButtons 
                section="contactMethods" 
                onSave={() => saveSection('contactMethods', { contactMethods: contactMethodsData })}
              />
            </CardHeader>
            <CardContent>
              {editingSections.contactMethods ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="font-medium">Email Addresses</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addEmail}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Email
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {contactMethodsData.filter(m => m.type === ContactMethodType.EMAIL).map((method) => (
                        <div key={method.id} className="flex gap-2">
                          <Input 
                            value={method.value} 
                            onChange={(e) => updateContactMethod(method.id, { value: e.target.value })}
                            placeholder="email@example.com"
                            type="email"
                          />
                          <Input 
                            value={method.label || ''} 
                            onChange={(e) => updateContactMethod(method.id, { label: e.target.value })}
                            placeholder="Label (optional)"
                            className="w-32"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContactMethod(method.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {contactMethodsData.filter(m => m.type === ContactMethodType.EMAIL).length === 0 && (
                        <p className="text-sm text-gray-500">No email addresses added</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="font-medium">Phone Numbers</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addPhone}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Phone
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {contactMethodsData.filter(m => m.type === ContactMethodType.PHONE).map((method) => (
                        <div key={method.id} className="flex gap-2">
                          <Input 
                            value={method.value} 
                            onChange={(e) => updateContactMethod(method.id, { value: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                          />
                          <Input 
                            value={method.label || ''} 
                            onChange={(e) => updateContactMethod(method.id, { label: e.target.value })}
                            placeholder="Label (optional)"
                            className="w-32"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeContactMethod(method.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {contactMethodsData.filter(m => m.type === ContactMethodType.PHONE).length === 0 && (
                        <p className="text-sm text-gray-500">No phone numbers added</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {organisation.contactMethods && organisation.contactMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-medium text-sm text-gray-700 mb-2 block">Email Addresses</Label>
                        <div className="space-y-1">
                          {organisation.contactMethods.filter(m => m.type === ContactMethodType.EMAIL).map((method) => (
                            <div key={method.id} className="flex items-center space-x-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{method.value}</span>
                              {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                            </div>
                          ))}
                          {organisation.contactMethods.filter(m => m.type === ContactMethodType.EMAIL).length === 0 && (
                            <p className="text-sm text-gray-500">No email addresses</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="font-medium text-sm text-gray-700 mb-2 block">Phone Numbers</Label>
                        <div className="space-y-1">
                          {organisation.contactMethods.filter(m => m.type === ContactMethodType.PHONE).map((method) => (
                            <div key={method.id} className="flex items-center space-x-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{method.value}</span>
                              {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                            </div>
                          ))}
                          {organisation.contactMethods.filter(m => m.type === ContactMethodType.PHONE).length === 0 && (
                            <p className="text-sm text-gray-500">No phone numbers</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Mail className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-sm">No contact methods available</p>
                      {(organisation.email || organisation.phone) && (
                        <div className="mt-4 space-y-2 text-sm">
                          <p className="text-gray-600">Legacy contact information:</p>
                          {organisation.email && (
                            <div className="flex items-center justify-center space-x-2 text-gray-700">
                              <Mail className="h-4 w-4" />
                              <span>{organisation.email}</span>
                            </div>
                          )}
                          {organisation.phone && (
                            <div className="flex items-center justify-center space-x-2 text-gray-700">
                              <Phone className="h-4 w-4" />
                              <span>{organisation.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Social media presence and profiles</CardDescription>
              </div>
              <SectionEditButtons 
                section="socialMedia" 
                onSave={() => saveSection('socialMedia', { socialMedia: socialMediaData })}
              />
            </CardHeader>
            <CardContent>
              {editingSections.socialMedia ? (
                <div className="space-y-4">
                  {socialMediaData.map((social, index) => (
                    <div key={social.id} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Social Media {index + 1}</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeSocialMedia(social.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Platform</Label>
                        <Select 
                          value={social.platform} 
                          onValueChange={(value) => updateSocialMedia(social.id, { platform: value as SocialPlatform })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SocialPlatform.FACEBOOK}>Facebook</SelectItem>
                            <SelectItem value={SocialPlatform.INSTAGRAM}>Instagram</SelectItem>
                            <SelectItem value={SocialPlatform.TWITTER}>Twitter</SelectItem>
                            <SelectItem value={SocialPlatform.LINKEDIN}>LinkedIn</SelectItem>
                            <SelectItem value={SocialPlatform.TIKTOK}>TikTok</SelectItem>
                            <SelectItem value={SocialPlatform.YOUTUBE}>YouTube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>URL</Label>
                        <Input 
                          value={social.url} 
                          onChange={(e) => updateSocialMedia(social.id, { url: e.target.value })}
                          placeholder="https://facebook.com/company"
                        />
                      </div>
                      
                      <div>
                        <Label>Username (Optional)</Label>
                        <Input 
                          value={social.username || ''} 
                          onChange={(e) => updateSocialMedia(social.id, { username: e.target.value })}
                          placeholder="@company_name"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`active-${social.id}`}
                          checked={social.isActive !== false}
                          onCheckedChange={(checked) => updateSocialMedia(social.id, { isActive: Boolean(checked) })}
                        />
                        <Label htmlFor={`active-${social.id}`}>Active profile</Label>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={addSocialMedia}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Social Media Profile
                  </Button>
                </div>
              ) : (
                <div>
                  {organisation.socialMedia && organisation.socialMedia.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {organisation.socialMedia.map((social) => (
                        <div key={social.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {getSocialIcon(social.platform)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 capitalize">
                              {social.platform.toLowerCase()}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {social.username ? `@${social.username}` : 'Profile'}
                            </p>
                          </div>
                          <a
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-gray-400 mb-2">
                        <Link className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-sm">No social media profiles available</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organisation Connections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Business Relationships</CardTitle>
                <CardDescription>Connected partner organisations</CardDescription>
              </div>
              <SectionEditButtons 
                section="connections" 
                onSave={() => {
                  setEditingSections(prev => ({ ...prev, connections: false }));
                  toast.success('Connections updated');
                }}
              />
            </CardHeader>
            <CardContent>
              {editingSections.connections ? (
                <div className="space-y-4">
                  {/* Add new connection */}
                  {showAddConnection ? (
                    <div className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Add New Connection</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowAddConnection(false)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Select value={newConnectionOrgId} onValueChange={setNewConnectionOrgId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organisation" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOrgs
                              .filter(org => !connectionsData.some(conn => 
                                conn.fromOrganisationId === org.id || conn.toOrganisationId === org.id
                              ))
                              .map(org => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name} ({org.type.toLowerCase().replace('_', ' ')})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <Button onClick={addConnection} disabled={!newConnectionOrgId}>
                          Connect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddConnection(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connection
                    </Button>
                  )}
                  
                  {/* Existing connections */}
                  <div className="space-y-2">
                    {connectionsData.map((connection) => {
                      const isOutgoing = connection.fromOrganisationId === orgId;
                      const relatedOrgId = isOutgoing ? connection.toOrganisationId : connection.fromOrganisationId;
                      const relatedOrg = connectedOrgs.find(org => org.id === relatedOrgId) || availableOrgs.find(org => org.id === relatedOrgId);
                      
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {relatedOrg?.name || 'Unknown Organisation'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {relatedOrg ? getRelationshipDescription(organisation.type, relatedOrg.type) : 'Business partner'}
                                {relatedOrg && <span className="ml-2 text-xs">({relatedOrg.type.toLowerCase().replace('_', ' ')})</span>}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeConnection(connection.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {connectionsData.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No connections yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {connectionsData.length > 0 ? (
                    <div className="space-y-2">
                      {connectionsData.map((connection) => {
                        const isOutgoing = connection.fromOrganisationId === orgId;
                        const relatedOrgId = isOutgoing ? connection.toOrganisationId : connection.fromOrganisationId;
                        const relatedOrg = connectedOrgs.find(org => org.id === relatedOrgId);
                        
                        return (
                          <div key={connection.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {relatedOrg?.name || 'Unknown Organisation'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {relatedOrg ? getRelationshipDescription(organisation.type, relatedOrg.type) : 'Business partner'}
                                {relatedOrg && <span className="ml-2 text-xs">({relatedOrg.type.toLowerCase().replace('_', ' ')})</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No business relationships established</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Address</CardTitle>
                <CardDescription>Physical location of the organisation</CardDescription>
              </div>
              <SectionEditButtons 
                section="address" 
                onSave={() => saveSection('address', addressData)}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  {editingSections.address ? (
                    <Input
                      id="address"
                      value={addressData.address}
                      onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.address || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  {editingSections.address ? (
                    <Input
                      id="city"
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      placeholder="New York"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.city || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  {editingSections.address ? (
                    <Input
                      id="state"
                      value={addressData.state}
                      onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      placeholder="NY"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.state || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  {editingSections.address ? (
                    <Input
                      id="country"
                      value={addressData.country}
                      onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                      placeholder="United States"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.country || 'Not specified'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  {editingSections.address ? (
                    <Input
                      id="postalCode"
                      value={addressData.postalCode}
                      onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                      placeholder="10001"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">
                      {organisation.postalCode || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and other details</CardDescription>
              </div>
              <SectionEditButtons 
                section="notes" 
                onSave={() => saveSection('notes', notesData)}
              />
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
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
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                    {organisation.notes || 'No notes added'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>People associated with this organisation</CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.title && (
                            <p className="text-sm text-gray-500">{contact.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {contact.email && (
                          <p className="text-sm text-gray-600">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-sm text-gray-500">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No contacts found for this organisation
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deals</CardTitle>
              <CardDescription>Sales opportunities with this organisation</CardDescription>
            </CardHeader>
            <CardContent>
              {deals.length > 0 ? (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push(`/crm/deals?id=${deal.id}`)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{deal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              deal.status === 'WON' ? 'default' :
                              deal.status === 'LOST' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {deal.status}
                          </Badge>
                          {deal.amount && (
                            <span className="text-sm text-gray-600">
                              {formatCurrency(deal.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Created {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                        {deal.probability && (
                          <p className="text-sm text-gray-500">{deal.probability}% probability</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No deals found for this organisation
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Type Change Confirmation Dialog */}
      <Dialog open={showTypeChangeConfirm} onOpenChange={setShowTypeChangeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Organization Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                You are about to change the organization type from{' '}
                <span className="font-semibold text-gray-900 capitalize">
                  {organisation?.type?.toLowerCase().replace('_', ' ')}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-900 capitalize">
                  {pendingTypeChange?.toLowerCase().replace('_', ' ')}
                </span>.
              </p>
              <p className="mb-2">
                <span className="font-semibold text-orange-600">Warning:</span> This will clear all type-specific data for this organization, as different organization types have different data requirements.
              </p>
              {organisation?.typeSpecificData && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-2">
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    The following data will be lost:
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1">
                    {Object.entries(organisation.typeSpecificData).map(([key, value]) => (
                      <li key={key} className="flex">
                        <span className="capitalize font-medium min-w-0 flex-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="ml-2 text-right truncate max-w-[200px]">
                          {Array.isArray(value) 
                            ? value.join(', ') 
                            : typeof value === 'object' && value !== null 
                              ? JSON.stringify(value, null, 0)
                              : String(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelTypeChange}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmTypeChange}>
                Change Type & Clear Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}