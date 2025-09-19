"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2, Plus, Search, X, Trash2 } from 'lucide-react';
import { Contact, Organisation, ContactType } from '@united-cars/crm-core';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { COUNTRIES_REGIONS, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';


export default function ContactsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    organisationId: '',
    country: ''
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    type: '',
    organisationId: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postalCode: ''
  });
  const [showCustomCity, setShowCustomCity] = useState(false);

  useEffect(() => {
    const loadOrganisations = async () => {
      try {
        const data = await fetch('/api/crm/organisations').then(r => r.json());
        setOrganisations(data);
      } catch (error) {
        console.error('Failed to load organisations:', error);
        toast.error('Failed to load organisations');
      }
    };
    loadOrganisations();
  }, []);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        
        if (filters.organisationId && filters.organisationId !== 'all') {
          params.append('organisationId', filters.organisationId);
        }
        
        if (filters.country.trim()) {
          params.append('country', filters.country.trim());
        }
        
        const url = params.toString() 
          ? `/api/crm/contacts?${params.toString()}`
          : '/api/crm/contacts';
        
        const response = await fetch(url);
        const data = await response.json();
        setContacts(data || []);
      } catch (error) {
        console.error('Failed to load contacts:', error);
        toast.error('Failed to load contacts');
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.organisationId, filters.country]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Pre-select organization if provided
    const orgId = urlParams.get('orgId');
    if (orgId) {
      setFormData(prev => ({ ...prev, organisationId: orgId }));
      setFilters(prev => ({ ...prev, organisationId: orgId }));
    }
  }, []);

  const getOrganisationName = (orgId?: string) => {
    if (!orgId) return null;
    const org = organisations.find(o => o.id === orgId);
    return org?.name;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      organisationId: '',
      country: ''
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery || 
    (filters.organisationId && filters.organisationId !== 'all') ||
    filters.country
  );

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };



  const handleCreate = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.type || !formData.phone || !formData.country) {
      alert('Please fill in all required fields: First Name, Last Name, Type, Phone, and Country');
      return;
    }

    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          type: '',
          organisationId: '',
          country: '',
          state: '',
          city: '',
          address: '',
          postalCode: ''
        });
        setShowCustomCity(false);
        const loadContacts = async () => {
          const data = await fetch('/api/crm/contacts').then(r => r.json());
          setContacts(data);
        };
        loadContacts();
        toast.success(`Contact created: ${formData.firstName} ${formData.lastName}`);
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the contact from the local state
        setContacts(prevContacts => prevContacts.filter(c => c.id !== contact.id));
        toast.success(`Contact deleted: ${contact.firstName} ${contact.lastName}`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to delete contact: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Contacts"
          description="Manage your people and relationships"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Contacts' }]}
        />
        <LoadingState text="Loading contacts..." />
      </AppLayout>
    );
  }

  const newContactButton = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Contact Type <span className="text-red-500">*</span></Label>
            <Select value={formData.type || undefined} onValueChange={(value) => setFormData({ ...formData, type: value || '' })}>
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0100"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="organisationId">Organisation</Label>
            <Select value={formData.organisationId || undefined} onValueChange={(value) => setFormData({ ...formData, organisationId: value || '' })}>
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

          {/* Location Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value, state: '', city: '' })}
              >
                <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State/Region</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value, city: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state/region..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getRegionsByCountryCode(formData.country).map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                {getCitiesByRegion(formData.country, formData.state).length > 0 ? (
                  <>
                    <Select
                      value={showCustomCity ? '__custom__' : formData.city}
                      onValueChange={(value) => {
                        if (value === '__custom__') {
                          setShowCustomCity(true);
                          setFormData({ ...formData, city: '' });
                        } else {
                          setShowCustomCity(false);
                          setFormData({ ...formData, city: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesByRegion(formData.country, formData.state).map((city) => (
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
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city name..."
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city name..."
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.firstName || !formData.lastName || !formData.type || !formData.phone || !formData.country}>
              Create Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Contacts"
        description="Manage your people and relationships"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Contacts' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Organisation Filter */}
              <div className="min-w-[200px]">
                <Select
                  value={filters.organisationId || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, organisationId: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
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
              
              {/* Country Filter */}
              <div className="min-w-[150px]">
                <Input
                  placeholder="Country..."
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                />
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
              
              {/* New Contact Button */}
              <div className="flex-shrink-0">
                {newContactButton}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <User className="h-12 w-12 text-gray-300" />
                    <div className="text-gray-500">
                      {hasActiveFilters ? 'No contacts match your filters' : 'No contacts found'}
                    </div>
                    {hasActiveFilters && (
                      <Button type="button" variant="outline" onClick={clearFilters} className="text-sm">
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link 
                      href={`/crm/contacts/${contact.id}`}
                      className="font-medium text-blue-600 hover:underline flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span dangerouslySetInnerHTML={{ 
                        __html: searchQuery 
                          ? `${contact.firstName} ${contact.lastName}`.replace(
                              new RegExp(`(${escapeRegex(searchQuery)})`, 'gi'),
                              '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                            )
                          : `${contact.firstName} ${contact.lastName}`
                      }} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contact.type ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {contact.type.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.organisationId ? (
                      <button
                        onClick={() => router.push(`/crm/organisations/${contact.organisationId}`)}
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                        {getOrganisationName(contact.organisationId) || 'Unknown'}
                      </button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.country || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-gray-500 hover:text-gray-700">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-gray-500 hover:text-gray-700">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}