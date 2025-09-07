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
import { Edit2, Save, X, User, FileText, DollarSign, Mail, Phone, Hash } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Contact, Organisation, Deal, ContactMethod, ContactMethodType, EntityType } from '@united-cars/crm-core';
import { ChangeLogPanel } from '@/components/ui/change-log';
import toast from 'react-hot-toast';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Section-specific editing states
  const [editingSections, setEditingSections] = useState({
    basicInfo: false,
    address: false,
    notes: false
  });
  
  // Section-specific form data
  const [basicInfoData, setBasicInfoData] = useState({
    firstName: '',
    lastName: '',
    title: ''
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

  useEffect(() => {
    if (contactId) {
      fetchContact();
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
          title: data.title || ''
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
        if (data.orgId) {
          const orgResponse = await fetch(`/api/crm/organisations/${data.orgId}`);
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

  // Section-specific save handlers
  const saveSection = async (section: string, data: any) => {
    if (!contact) return;

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
          title: contact.title || ''
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
          onClick={() => setEditingSections(prev => ({ ...prev, [section]: true }))} 
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

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Label htmlFor="firstName">First Name</Label>
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
                      <Label htmlFor="lastName">Last Name</Label>
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
                    <Label htmlFor="title">Title</Label>
                    {editingSections.basicInfo ? (
                      <Input
                        id="title"
                        value={basicInfoData.title}
                        onChange={(e) => setBasicInfoData({ ...basicInfoData, title: e.target.value })}
                        placeholder="Sales Manager"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {contact.title || 'Not specified'}
                      </p>
                    )}
                  </div>

                  {/* Contact Methods Section */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Contact Methods</Label>
                      <SectionEditButtons 
                        section="contactMethods" 
                        onSave={() => saveSection('contactMethods', { contactMethods: contactMethodsData })}
                      />
                    </div>
                    
                    {editingSections.contactMethods ? (
                      <div className="space-y-3">
                        {contactMethodsData.map((method, index) => (
                          <div key={method.id} className="p-3 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">Contact Method {index + 1}</h4>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeContactMethod(method.id)}
                                disabled={contactMethodsData.length === 1}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select 
                                value={method.type} 
                                onValueChange={(value) => updateContactMethod(method.id, { type: value as ContactMethodType })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={ContactMethodType.EMAIL_WORK}>Email (Work)</SelectItem>
                                  <SelectItem value={ContactMethodType.EMAIL_PERSONAL}>Email (Personal)</SelectItem>
                                  <SelectItem value={ContactMethodType.EMAIL_OTHER}>Email (Other)</SelectItem>
                                  <SelectItem value={ContactMethodType.PHONE_MOBILE}>Phone (Mobile)</SelectItem>
                                  <SelectItem value={ContactMethodType.PHONE_WORK}>Phone (Work)</SelectItem>
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
                                onChange={(e) => updateContactMethod(method.id, { value: e.target.value })}
                                placeholder={method.type.includes('EMAIL') ? 'email@example.com' : '+1 (555) 000-0000'}
                                className="h-8"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`primary-${method.id}`}
                                checked={method.isPrimary || false}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setContactMethodsData(prev => prev.map(m => 
                                      m.id === method.id ? { ...m, isPrimary: true } : { ...m, isPrimary: false }
                                    ));
                                  }
                                }}
                              />
                              <Label htmlFor={`primary-${method.id}`} className="text-xs">Primary</Label>
                            </div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          onClick={addContactMethod}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Contact Method
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {contact.contactMethods && contact.contactMethods.length > 0 ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-700 mb-1 block">Email Addresses</Label>
                              <div className="space-y-1">
                                {contact.contactMethods.filter(m => m.type.includes('EMAIL')).map((method) => (
                                  <div key={method.id} className="flex items-center space-x-2 text-sm">
                                    <Mail className="h-3 w-3 text-gray-500" />
                                    <span>{method.value}</span>
                                    {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                                  </div>
                                ))}
                                {contact.contactMethods.filter(m => m.type.includes('EMAIL')).length === 0 && (
                                  <p className="text-xs text-gray-500">No email addresses</p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs font-medium text-gray-700 mb-1 block">Phone Numbers</Label>
                              <div className="space-y-1">
                                {contact.contactMethods.filter(m => m.type.includes('PHONE')).map((method) => (
                                  <div key={method.id} className="flex items-center space-x-2 text-sm">
                                    <Phone className="h-3 w-3 text-gray-500" />
                                    <span>{method.value}</span>
                                    {method.label && <span className="text-xs text-gray-500">({method.label})</span>}
                                  </div>
                                ))}
                                {contact.contactMethods.filter(m => m.type.includes('PHONE')).length === 0 && (
                                  <p className="text-xs text-gray-500">No phone numbers</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm">
                            <p className="text-gray-500">No contact methods available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {organisation && (
                    <div>
                      <Label>Organisation</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {organisation.name}
                      </p>
                    </div>
                  )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      {editingSections.address ? (
                        <Input
                          id="city"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          placeholder="New York"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.city || 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">State/Region</Label>
                      {editingSections.address ? (
                        <Input
                          id="state"
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          placeholder="NY"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.state || 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      {editingSections.address ? (
                        <Input
                          id="country"
                          value={addressData.country}
                          onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                          placeholder="United States"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">
                          {contact.country || 'Not specified'}
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
              <CardHeader>
                <CardTitle>Deals</CardTitle>
                <CardDescription>Sales opportunities with this contact</CardDescription>
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
    </AppLayout>
  );
}