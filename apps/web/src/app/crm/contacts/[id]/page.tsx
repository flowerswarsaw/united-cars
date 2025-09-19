"use client";

// Contact detail page
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit2, Save, X, User, FileText, DollarSign, Mail, Phone, Hash, Building2, Plus, Trash2, MoreHorizontal, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Contact, Organisation, Deal, ContactMethod, ContactMethodType, ContactType, EntityType } from '@united-cars/crm-core';
import { ChangeLogPanel } from '@/components/ui/change-log';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COUNTRIES_REGIONS, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
import toast from 'react-hot-toast';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomCity, setShowCustomCity] = useState(false);

  // Section-specific editing states
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    contactInfo: false,
    address: false,
    notes: false
  });

  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    firstName: '',
    lastName: '',
    type: '',
    organisationId: ''
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
  
  const [notesData, setNotesData] = useState({
    notes: ''
  });

  // Deal creation dialog state
  const [isDealCreateOpen, setIsDealCreateOpen] = useState(false);
  const [dealFormData, setDealFormData] = useState({
    title: '',
    description: '',
    value: '',
    stage: '',
    pipeline: 'DEALER'
  });

  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchOrganisations();
    }
  }, [contactId]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`);
      const data = await response.json();
      
      if (response.ok) {
        setContact(data);
        
        // Initialize section-specific data
        setBasicInfoData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          title: data.title || '',
          organisationId: data.organisationId || ''
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
        
        setNotesData({
          notes: data.notes || ''
        });

        // Fetch organization if contact has one
        if (data.organisationId) {
          const orgResponse = await fetch(`/api/crm/organisations/${data.organisationId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setOrganisation(orgData);
          }
        }

        // Fetch associated deals
        const dealsResponse = await fetch(`/api/crm/deals?contactId=${contactId}`);
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json();
          setDeals(dealsData || []);
        }
      } else {
        toast.error(`Failed to fetch contact: ${data.error}`);
        router.push('/crm/contacts');
      }
    } catch (error) {
      toast.error('Error fetching contact details');
      console.error('Error:', error);
      router.push('/crm/contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganisations = async () => {
    try {
      const response = await fetch('/api/crm/organisations');
      if (response.ok) {
        const data = await response.json();
        setOrganisations(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch organisations:', error);
    }
  };

  // Section-specific save handlers
  const saveSection = async (section: string, data: any) => {
    if (!contact) return;

    // Validation for basic info section
    if (section === 'basicInfo') {
      if (!data.firstName?.trim()) {
        toast.error('First name is required');
        return;
      }
      if (!data.lastName?.trim()) {
        toast.error('Last name is required');
        return;
      }
      if (!data.type) {
        toast.error('Contact type is required');
        return;
      }
    }

    // Validation for contact info section
    if (section === 'contactInfo') {
      const hasPhone = data.contactMethods?.some((method: any) =>
        method.type?.includes('PHONE') && method.value?.trim()
      );
      if (!hasPhone) {
        toast.error('At least one phone number is required');
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

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok) {
        setContact(responseData);
        setEditingSections(prev => ({ ...prev, [section]: false }));

        // If organization was updated, fetch the new organization details
        if (section === 'basicInfo' && data.organisationId !== contact.organisationId) {
          if (data.organisationId) {
            const orgResponse = await fetch(`/api/crm/organisations/${data.organisationId}`);
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              setOrganisation(orgData);
            }
          } else {
            setOrganisation(null);
          }
        }

        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`);
      } else {
        toast.error(`Failed to update ${section}: ${responseData.error}`);
      }
    } catch (error) {
      toast.error(`Error updating ${section}`);
      console.error('Error:', error);
    }
  };

  // Section-specific cancel handlers
  const cancelSection = (section: string) => {
    if (!contact) return;

    switch (section) {
      case 'basicInfo':
        setBasicInfoData({
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          type: contact.type || '',
          organisationId: contact.organisationId || ''
        });
        break;
      case 'contactInfo':
        setContactInfoData({
          contactMethods: contact.contactMethods || []
        });
        break;
      case 'address':
        setAddressData({
          address: contact.address || '',
          city: contact.city || '',
          state: contact.state || '',
          country: contact.country || '',
          postalCode: contact.postalCode || ''
        });
        break;
      case 'notes':
        setNotesData({
          notes: contact.notes || ''
        });
        break;
    }

    setEditingSections(prev => ({ ...prev, [section]: false }));
  };

  const deleteContact = async () => {
    if (!contact) return;

    if (!confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Contact deleted successfully');
        router.push('/crm/contacts');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete contact: ${errorData.error}`);
      }
    } catch (error) {
      toast.error('Error deleting contact');
      console.error('Error:', error);
    }
  };

  const handleCreateDeal = async () => {
    if (!dealFormData.title || !dealFormData.stage) {
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
          description: dealFormData.description,
          value: dealFormData.value ? parseFloat(dealFormData.value) : undefined,
          organisationId: contact?.organisationId,
          contactId: contactId,
          pipeline: dealFormData.pipeline,
          stage: dealFormData.stage,
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
          stage: '',
          pipeline: 'DEALER'
        });
        fetchContact(); // Reload contact data which includes deals
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create deal');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Error creating deal');
    }
  };

  // Helper functions for contact methods
  const addContactMethod = () => {
    const newMethod: ContactMethod = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ContactMethodType.EMAIL_WORK,
      value: '',
      isPrimary: false
    };
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: [...prev.contactMethods, newMethod]
    }));
  };

  const removeContactMethod = (id: string) => {
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.filter(method => method.id !== id)
    }));
  };

  const updateContactMethod = (id: string, updates: Partial<ContactMethod>) => {
    setContactInfoData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.map(method =>
        method.id === id ? { ...method, ...updates } : method
      )
    }));
  };

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return 'Unknown';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getContactMethodIcon = (type: ContactMethodType) => {
    if (type.includes('EMAIL')) {
      return <Mail className="h-4 w-4" />;
    } else if (type.includes('PHONE')) {
      return <Phone className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  const formatContactMethod = (method: ContactMethod) => {
    // Convert EMAIL_WORK to "email (work)", PHONE_MOBILE to "phone (mobile)"
    const [mainType, subType] = method.type.split('_');
    let typeLabel = mainType.toLowerCase();
    if (subType) {
      typeLabel += ` (${subType.toLowerCase()})`;
    }
    if (method.label) {
      typeLabel += ` - ${method.label}`;
    }
    return typeLabel;
  };

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
          onClick={() => {
            cancelSection(section); // Initialize form data
            setEditingSections(prev => ({ ...prev, [section]: true }));
          }}
          size="sm"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading contact details..." />
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout user={user}>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Contact not found</h2>
          <p className="text-gray-500 mb-6">The requested contact could not be found.</p>
          <Button onClick={() => router.push('/crm/contacts')}>
            ← Back to Contacts
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={`${contact.title || 'Contact'} ${organisation ? `at ${organisation.name}` : ''}`}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts', href: '/crm/contacts' },
          { label: `${contact.firstName} ${contact.lastName}` }
        ]}
        actions={null}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs defaultValue="details" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Details
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
              onClick={deleteContact}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Contact details and personal information</CardDescription>
                  </div>
                  <SectionEditButtons 
                    section="basicInfo" 
                    onSave={() => saveSection('basicInfo', basicInfoData)}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      {editingSections.basicInfo ? (
                        <Input
                          id="firstName"
                          value={basicInfoData.firstName}
                          onChange={(e) => setBasicInfoData({ ...basicInfoData, firstName: e.target.value })}
                          placeholder="John"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.firstName || 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                      {editingSections.basicInfo ? (
                        <Input
                          id="lastName"
                          value={basicInfoData.lastName}
                          onChange={(e) => setBasicInfoData({ ...basicInfoData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.lastName || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                    {editingSections.basicInfo ? (
                      <Select
                        value={basicInfoData.type || undefined}
                        onValueChange={(value) => setBasicInfoData({
                          ...basicInfoData,
                          type: value || ''
                        })}
                      >
                        <SelectTrigger className="mt-1">
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
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {contact.type ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {contact.type.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    )}
                  </div>


                  <div>
                    <Label htmlFor="organisation">Organisation</Label>
                    {editingSections.basicInfo ? (
                      <Select
                        value={basicInfoData.organisationId || "none"}
                        onValueChange={(value) => setBasicInfoData({
                          ...basicInfoData,
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
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Phone numbers, emails, and contact methods <span className="text-red-500">* At least one phone required</span></CardDescription>
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
                      <div className="space-y-3 mt-1">
                        {contactInfoData.contactMethods.map((method, index) => (
                          <div key={method.id} className="p-4 border rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={method.type}
                                  onValueChange={(value) => updateContactMethod(method.id!, { type: value as ContactMethodType })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={ContactMethodType.EMAIL_WORK}>Email (Work)</SelectItem>
                                    <SelectItem value={ContactMethodType.EMAIL_PERSONAL}>Email (Personal)</SelectItem>
                                    <SelectItem value={ContactMethodType.EMAIL_OTHER}>Email (Other)</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE_WORK}>Phone (Work)</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE_MOBILE}>Phone (Mobile)</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE_HOME}>Phone (Home)</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE_FAX}>Phone (Fax)</SelectItem>
                                    <SelectItem value={ContactMethodType.PHONE_OTHER}>Phone (Other)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  value={method.value}
                                  onChange={(e) => updateContactMethod(method.id!, { value: e.target.value })}
                                  placeholder={method.type.includes('EMAIL') ? 'email@example.com' : '+1 (555) 123-4567'}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeContactMethod(method.id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addContactMethod}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact Method
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-1">
                        <div>
                          <Label className="text-xs font-medium text-gray-700 mb-1 block">Email Addresses</Label>
                          <div className="space-y-1">
                            {contact.contactMethods?.filter(m => m.type.includes('EMAIL')).map((method, index) => (
                              <div key={method.id || `email-${index}`} className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-500" />
                                <span>{method.value}</span>
                                {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                              </div>
                            )) || <p className="text-xs text-gray-500">No email addresses</p>}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-gray-700 mb-1 block">Phone Numbers</Label>
                          <div className="space-y-1">
                            {contact.contactMethods?.filter(m => m.type.includes('PHONE')).map((method, index) => (
                              <div key={method.id || `phone-${index}`} className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span>{method.value}</span>
                                {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                              </div>
                            )) || <p className="text-xs text-gray-500">No phone numbers</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>Contact location and address details</CardDescription>
                  </div>
                  <SectionEditButtons 
                    section="address" 
                    onSave={() => saveSection('address', addressData)}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                      {editingSections.address ? (
                        <Select
                          value={addressData.country}
                          onValueChange={(value) => setAddressData({ ...addressData, country: value, state: '', city: '' })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select country..." />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES_REGIONS.countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.country || 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">State/Region</Label>
                      {editingSections.address ? (
                        <Select
                          value={addressData.state}
                          onValueChange={(value) => setAddressData({ ...addressData, state: value, city: '' })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select state/region..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getRegionsByCountryCode(addressData.country).map((region) => (
                              <SelectItem key={region.code} value={region.code}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.state ? (hasRegions(contact.country || '') ? getRegionDisplayName(contact.country || '', contact.state) : contact.state) : 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      {editingSections.address ? (
                        getCitiesByRegion(addressData.country, addressData.state).length > 0 ? (
                          <>
                            <Select
                              value={showCustomCity ? '__custom__' : addressData.city}
                              onValueChange={(value) => {
                                if (value === '__custom__') {
                                  setShowCustomCity(true);
                                  setAddressData({ ...addressData, city: '' });
                                } else {
                                  setShowCustomCity(false);
                                  setAddressData({ ...addressData, city: value });
                                }
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select city..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getCitiesByRegion(addressData.country, addressData.state).map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__custom__">Other/Custom city...</SelectItem>
                              </SelectContent>
                            </Select>
                            {showCustomCity && (
                              <Input
                                id="city"
                                value={addressData.city}
                                onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                                placeholder="Enter city name..."
                                className="mt-2"
                              />
                            )}
                          </>
                        ) : (
                          <Input
                            id="city"
                            value={addressData.city}
                            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                            placeholder="Enter city name..."
                            className="mt-1"
                          />
                        )
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.city || 'Not specified'}
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
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.postalCode || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    {editingSections.address ? (
                      <Input
                        id="address"
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        placeholder="123 Main Street"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {contact.address || 'Not specified'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

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
                      placeholder="Add notes about this contact..."
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {contact.notes || 'No notes added'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Deals</CardTitle>
                  <CardDescription>Sales opportunities with this contact</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsDealCreateOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Deal
                </Button>
              </CardHeader>
              <CardContent>
                {deals.length > 0 ? (
                  <div className="space-y-3">
                    {deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => router.push(`/crm/deals/${deal.id}`)}
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
                            Created {formatDate(deal.createdAt)}
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
                    No deals found for this contact
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ChangeLogPanel 
              entityType={EntityType.CONTACT} 
              entityId={contactId} 
              limit={50}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Deal Creation Dialog */}
      <Dialog open={isDealCreateOpen} onOpenChange={setIsDealCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Contact:</span>
                <span>{contact?.firstName} {contact?.lastName}</span>
                {contact?.type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {contact.type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {organisation && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">Organization:</span>
                  <span>{organisation.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {organisation.type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deal-pipeline">Pipeline</Label>
                <Select
                  value={dealFormData.pipeline}
                  onValueChange={(value) => setDealFormData({ ...dealFormData, pipeline: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEALER">Dealer Pipeline</SelectItem>
                    <SelectItem value="INTEGRATION">Integration Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deal-stage">Stage *</Label>
                <Select
                  value={dealFormData.stage}
                  onValueChange={(value) => setDealFormData({ ...dealFormData, stage: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealFormData.pipeline === 'DEALER' ? (
                      <>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                        <SelectItem value="PROPOSAL">Proposal</SelectItem>
                        <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                        <SelectItem value="CLOSING">Closing</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="DISCOVERY">Discovery</SelectItem>
                        <SelectItem value="TECHNICAL_REVIEW">Technical Review</SelectItem>
                        <SelectItem value="INTEGRATION">Integration</SelectItem>
                        <SelectItem value="TESTING">Testing</SelectItem>
                        <SelectItem value="DEPLOYMENT">Deployment</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                    stage: '',
                    pipeline: 'DEALER'
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