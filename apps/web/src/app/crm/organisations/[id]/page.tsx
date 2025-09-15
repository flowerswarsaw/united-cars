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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, Save, X, Building2, MapPin, Globe, Mail, Phone, Users, DollarSign, FileText, ExternalLink, Facebook, Instagram, Twitter, Plus, Trash2, Star } from 'lucide-react';
import { Organisation, Contact, Deal, OrganizationType, ContactMethod, ContactMethodType, SocialMediaLink, SocialPlatform, OrganisationConnection } from '@united-cars/crm-core';
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
  
  // Section-specific edit states
  const [editingSections, setEditingSections] = useState<{
    basicInfo: boolean;
    contactInfo: boolean;
    businessRelationships: boolean;
    address: boolean;
    notes: boolean;
  }>({
    basicInfo: false,
    contactInfo: false,
    businessRelationships: false,
    address: false,
    notes: false
  });
  
  // Section-specific form data
  const [formData, setFormData] = useState<Partial<Organisation>>({});
  const [availableOrgs, setAvailableOrgs] = useState<Organisation[]>([]);

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
      
      // Initialize form data
      setFormData(data);
      
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
      
      // Update form data with connections
      setFormData(prev => ({
        ...prev,
        connections: orgConnections
      }));

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



  // Section editing helpers
  const startEditing = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const cancelEditing = (section: keyof typeof editingSections) => {
    // Reset form data to original organization data
    if (organisation) {
      setFormData(organisation);
    }
    setEditingSections(prev => ({ ...prev, [section]: false }));
  };

  const saveSection = async (section: keyof typeof editingSections) => {
    if (!organisation) return;

    try {
      const response = await fetch(`/api/crm/organisations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updated = await response.json();
        setOrganisation(updated);
        setFormData(updated);
        setEditingSections(prev => ({ ...prev, [section]: false }));
        toast.success('Changes saved successfully');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update');
      }
    } catch (error: any) {
      console.error('Failed to update organisation:', error);
      toast.error(error.message || 'Failed to save changes');
    }
  };

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Contact method helpers
  const getContactMethodsForEditing = (type: 'email' | 'phone') => {
    const methods = formData.contactMethods || [];
    const prefix = type === 'email' ? 'EMAIL' : 'PHONE';
    return methods.filter(m => m.type.startsWith(prefix));
  };

  const addContactMethod = (type: 'email' | 'phone') => {
    const newMethod = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type === 'email' ? ContactMethodType.EMAIL_WORK : ContactMethodType.PHONE_WORK,
      value: '',
      isPrimary: false
    };
    
    setFormData(prev => ({
      ...prev,
      contactMethods: [...(prev.contactMethods || []), newMethod]
    }));
  };

  const updateContactMethod = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: (prev.contactMethods || []).map(method =>
        method.id === id ? { ...method, [field]: value } : method
      )
    }));
  };

  const removeContactMethod = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: (prev.contactMethods || []).filter(method => method.id !== id)
    }));
  };

  // Business relationship helpers
  const getBusinessRelationshipsForEditing = () => {
    return formData.connections || [];
  };

  const addBusinessRelationship = () => {
    const newConnection = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromOrganisationId: orgId,
      toOrganisationId: '',
      type: 'PARTNER',
      createdAt: new Date().toISOString()
    };
    
    setFormData(prev => ({
      ...prev,
      connections: [...(prev.connections || []), newConnection]
    }));
  };

  const updateBusinessRelationship = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      connections: (prev.connections || []).map(connection =>
        connection.id === id ? { ...connection, [field]: value } : connection
      )
    }));
  };

  const removeBusinessRelationship = (id: string) => {
    setFormData(prev => ({
      ...prev,
      connections: (prev.connections || []).filter(connection => connection.id !== id)
    }));
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
        return <Facebook className="h-3 w-3" />;
      case SocialPlatform.INSTAGRAM:
        return <Instagram className="h-3 w-3" />;
      case SocialPlatform.TWITTER:
        return <Twitter className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
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


  const orgTypeLabel = organisation.type.toLowerCase().replace('_', ' ');
  const orgDescription = `${orgTypeLabel}${organisation.industry ? ' • ' + organisation.industry : ''} • ${contacts.length} contacts • ${activeDeals} active deals • ${formatCurrency(totalDealsValue)} total value`;

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
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">

          {/* Main Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Organisation Details</CardTitle>
                <div className="flex gap-2">
                  {editingSections.basicInfo ? (
                    <>
                      <Button onClick={() => saveSection('basicInfo')} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => cancelEditing('basicInfo')} size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => startEditing('basicInfo')} 
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organisation Name</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{organisation.name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company ID</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      value={formData.companyId || ''}
                      onChange={(e) => updateField('companyId', e.target.value)}
                      placeholder="COMP-001"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {organisation.companyId || 'Not specified'}
                      </code>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</Label>
                  {editingSections.basicInfo ? (
                    <Select
                      value={formData.type || organisation.type}
                      onValueChange={(value) => updateField('type', value)}
                    >
                      <SelectTrigger className="mt-1">
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
                    <p className="text-sm mt-1 capitalize">
                      {organisation.type.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Industry</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      value={formData.industry || ''}
                      onChange={(e) => updateField('industry', e.target.value)}
                      placeholder="e.g., Automotive, Technology"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{organisation.industry || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Size</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      value={formData.size || ''}
                      onChange={(e) => updateField('size', e.target.value)}
                      placeholder="e.g., 1-10, 50-100"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{organisation.size || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</Label>
                  {editingSections.basicInfo ? (
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {organisation.website ? (
                        <a
                          href={organisation.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {organisation.website.replace('https://', '').replace('http://', '')}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  )}
                </div>
              </div>


              
              {/* Contact Information */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
                  {!editingSections.contactInfo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing('contactInfo')}
                      className="h-7 px-3 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelEditing('contactInfo')}
                        className="h-7 px-3 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveSection('contactInfo', { contactMethods: formData.contactMethods })}
                        className="h-7 px-3 text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {editingSections.contactInfo ? (
                  <div className="space-y-4">
                    {/* Email Addresses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Addresses</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContactMethod('email')}
                          className="h-6 px-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Email
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {getContactMethodsForEditing('email').map((method, index) => (
                          <div key={method.id || `email-${index}`} className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <Input
                              value={method.value}
                              onChange={(e) => updateContactMethod(method.id || `email-${index}`, 'value', e.target.value)}
                              placeholder="email@example.com"
                              className="flex-1"
                            />
                            <Select
                              value={method.type}
                              onValueChange={(value) => updateContactMethod(method.id || `email-${index}`, 'type', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ContactMethodType.EMAIL_WORK}>Work</SelectItem>
                                <SelectItem value={ContactMethodType.EMAIL_PERSONAL}>Personal</SelectItem>
                                <SelectItem value={ContactMethodType.EMAIL_OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeContactMethod(method.id || `email-${index}`)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {getContactMethodsForEditing('email').length === 0 && (
                          <p className="text-xs text-gray-400">No email addresses</p>
                        )}
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Numbers</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContactMethod('phone')}
                          className="h-6 px-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Phone
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {getContactMethodsForEditing('phone').map((method, index) => (
                          <div key={method.id || `phone-${index}`} className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <Input
                              value={method.value}
                              onChange={(e) => updateContactMethod(method.id || `phone-${index}`, 'value', e.target.value)}
                              placeholder="+1-555-0100"
                              className="flex-1"
                            />
                            <Select
                              value={method.type}
                              onValueChange={(value) => updateContactMethod(method.id || `phone-${index}`, 'type', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ContactMethodType.PHONE_WORK}>Work</SelectItem>
                                <SelectItem value={ContactMethodType.PHONE_MOBILE}>Mobile</SelectItem>
                                <SelectItem value={ContactMethodType.PHONE_HOME}>Home</SelectItem>
                                <SelectItem value={ContactMethodType.PHONE_FAX}>Fax</SelectItem>
                                <SelectItem value={ContactMethodType.PHONE_OTHER}>Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeContactMethod(method.id || `phone-${index}`)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {getContactMethodsForEditing('phone').length === 0 && (
                          <p className="text-xs text-gray-400">No phone numbers</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Addresses</Label>
                      {organisation.contactMethods?.filter(m => m.type.startsWith('EMAIL')).map((method) => (
                        <div key={method.id} className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{method.value}</span>
                          <span className="text-xs text-gray-400">({method.type.replace('EMAIL_', '').toLowerCase()})</span>
                        </div>
                      ))}
                      {organisation.email && !organisation.contactMethods?.some(m => m.type.startsWith('EMAIL')) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{organisation.email}</span>
                        </div>
                      )}
                      {!organisation.contactMethods?.some(m => m.type.startsWith('EMAIL')) && !organisation.email && (
                        <p className="text-xs text-gray-400">No email addresses</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Numbers</Label>
                      {organisation.contactMethods?.filter(m => m.type.startsWith('PHONE')).map((method) => (
                        <div key={method.id} className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span>{method.value}</span>
                          <span className="text-xs text-gray-400">({method.type.replace('PHONE_', '').toLowerCase()})</span>
                        </div>
                      ))}
                      {organisation.phone && !organisation.contactMethods?.some(m => m.type.startsWith('PHONE')) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span>{organisation.phone}</span>
                        </div>
                      )}
                      {!organisation.contactMethods?.some(m => m.type.startsWith('PHONE')) && !organisation.phone && (
                        <p className="text-xs text-gray-400">No phone numbers</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              
              {/* Social Media */}
              {organisation.socialMedia && organisation.socialMedia.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Social Media</h3>
                  <div className="flex flex-wrap gap-2">
                    {organisation.socialMedia.map((social) => (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {getSocialIcon(social.platform)}
                        <span className="capitalize">{social.platform.toLowerCase()}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              
              {/* Business Relationships */}
              {(editingSections.businessRelationships || (connections && connections.length > 0)) && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Business Relationships</h3>
                    {!editingSections.businessRelationships ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing('businessRelationships')}
                        className="h-7 px-3 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addBusinessRelationship}
                          className="h-7 px-3 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing('businessRelationships')}
                          className="h-7 px-3 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSection('businessRelationships', { connections: formData.connections })}
                          className="h-7 px-3 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {editingSections.businessRelationships ? (
                      <>
                        {getBusinessRelationshipsForEditing().map((connection, index) => (
                          <div key={connection.id || `rel-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Building2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            <Select
                              value={connection.toOrganisationId}
                              onValueChange={(value) => updateBusinessRelationship(connection.id || `rel-${index}`, 'toOrganisationId', value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select organization..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableOrgs.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBusinessRelationship(connection.id || `rel-${index}`)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {getBusinessRelationshipsForEditing().length === 0 && (
                          <p className="text-xs text-gray-400">No business relationships</p>
                        )}
                      </>
                    ) : (
                      connections.map((connection) => {
                        const isOutgoing = connection.fromOrganisationId === orgId;
                        const relatedOrgId = isOutgoing ? connection.toOrganisationId : connection.fromOrganisationId;
                        const relatedOrg = connectedOrgs.find(org => org.id === relatedOrgId);
                        
                        return (
                          <div key={connection.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <Building2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {relatedOrg?.name || 'Unknown Organisation'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {relatedOrg ? getRelationshipDescription(organisation.type, relatedOrg.type) : 'Business partner'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              
              {/* Address */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Address</h3>
                  {!editingSections.address ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing('address')}
                      className="h-7 px-3 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelEditing('address')}
                        className="h-7 px-3 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveSection('address', { 
                          address: formData.address,
                          city: formData.city,
                          state: formData.state,
                          country: formData.country
                        })}
                        className="h-7 px-3 text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</Label>
                    {editingSections.address ? (
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="123 Main Street"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{organisation.address || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</Label>
                    {editingSections.address ? (
                      <Input
                        value={formData.city || ''}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="New York"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{organisation.city || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">State</Label>
                    {editingSections.address ? (
                      <Input
                        value={formData.state || ''}
                        onChange={(e) => updateField('state', e.target.value)}
                        placeholder="NY"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{organisation.state || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</Label>
                    {editingSections.address ? (
                      <Input
                        value={formData.country || ''}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="United States"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm mt-1">{organisation.country || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              
              {/* Notes */}
              {(editingSections.notes || organisation.notes) && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Additional Notes</h3>
                    {!editingSections.notes ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing('notes')}
                        className="h-7 px-3 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing('notes')}
                          className="h-7 px-3 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSection('notes', { notes: formData.notes })}
                          className="h-7 px-3 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingSections.notes ? (
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Add notes about this organisation..."
                      rows={3}
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {organisation.notes || 'No notes added'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          
          {/* Related Information */}
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-2">
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-blue-600">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.title && (
                          <p className="text-xs text-gray-500 truncate">{contact.title}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {contact.email && (
                          <p className="text-xs text-gray-600 truncate max-w-[120px]">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No contacts found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="space-y-2">
              {deals.length > 0 ? (
                <div className="space-y-2">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => router.push(`/crm/deals?id=${deal.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              deal.status === 'WON' ? 'default' :
                              deal.status === 'LOST' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs px-1.5 py-0.5"
                          >
                            {deal.status}
                          </Badge>
                          {deal.amount && (
                            <span className="text-xs text-gray-600">
                              {formatCurrency(deal.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-600">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                        {deal.probability && (
                          <p className="text-xs text-gray-500">{deal.probability}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No deals found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}