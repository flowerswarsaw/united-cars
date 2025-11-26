"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2, Plus, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { Contact, Organisation, ContactType, ContactMethodType } from '@united-cars/crm-core';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { LocationFieldGroup, CountrySelector, RegionSelector, CitySelector } from '@/components/location';
import { COUNTRIES_REGIONS, getCountryByCode, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
import { getUserName, getUserInitials } from '@/lib/crm-users';
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
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    organisationId: '',
    country: '',
    state: '',
    city: ''
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
  const [duplicateWarning, setDuplicateWarning] = useState<{
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

  useEffect(() => {
    const loadOrganisations = async () => {
      try {
        const response = await fetch('/api/crm/organisations');
        const data = await response.json();

        // Check if response is an error or if data is not an array
        if (!response.ok || !Array.isArray(data)) {
          console.error('Failed to load organisations:', data);
          setOrganisations([]);
          return;
        }

        setOrganisations(data);
      } catch (error) {
        console.error('Failed to load organisations:', error);
        setOrganisations([]);
      }
    };
    loadOrganisations();
  }, []);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsSearching(true);
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        if (filters.type && filters.type !== 'all') {
          params.append('type', filters.type);
        }

        if (filters.organisationId && filters.organisationId !== 'all') {
          params.append('organisationId', filters.organisationId);
        }

        if (filters.country) {
          params.append('country', filters.country);
        }

        if (filters.state) {
          params.append('state', filters.state);
        }

        if (filters.city) {
          params.append('city', filters.city);
        }

        const url = params.toString()
          ? `/api/crm/contacts?${params.toString()}`
          : '/api/crm/contacts';

        console.log('📡 Fetching contacts with URL:', url);
        console.log('🔎 Filter values:', { country: filters.country, state: filters.state, city: filters.city, type: filters.type });

        const response = await fetch(url);
        const data = await response.json();
        setContacts(data || []);
      } catch (error) {
        console.error('Failed to load contacts:', error);
        toast.error('Failed to load contacts');
        setContacts([]);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      loadContacts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.type, filters.organisationId, filters.country, filters.state, filters.city]);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicates(formData.email || undefined, formData.phone || undefined);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email, formData.phone]);

  const getOrganisationName = (orgId?: string) => {
    if (!orgId) return null;
    const org = organisations.find(o => o.id === orgId);
    return org?.name;
  };

  const getContactTypeLabel = (type?: string) => {
    if (!type) return null;
    const labels: Record<string, string> = {
      [ContactType.CEO]: 'CEO',
      [ContactType.VP]: 'VP',
      [ContactType.SALES]: 'Sales',
      [ContactType.PURCHASING]: 'Purchasing',
      [ContactType.OPERATIONS]: 'Operations',
      [ContactType.LOGISTICS]: 'Logistics',
      [ContactType.FINANCE]: 'Finance',
      [ContactType.ACCOUNTING]: 'Accounting',
      [ContactType.MARKETING]: 'Marketing',
      [ContactType.ADMINISTRATION]: 'Administration',
      [ContactType.RETAIL_BUYER]: 'Retail Buyer'
    };
    return labels[type] || type;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      type: '',
      organisationId: '',
      country: '',
      state: '',
      city: ''
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    (filters.type && filters.type !== 'all') ||
    (filters.organisationId && filters.organisationId !== 'all') ||
    filters.country ||
    filters.state ||
    filters.city
  );

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const checkDuplicates = async (email?: string, phone?: string) => {
    if (!email && !phone) {
      setDuplicateWarning(null);
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
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactMethods
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setDuplicateWarning(result.conflicts.length > 0 ? result : null);
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    }
  };



  const handleCreate = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.type || !formData.phone || !formData.country) {
      alert('Please fill in all required fields: First Name, Last Name, Type, Phone, and Country');
      return;
    }

    // Check for duplicates one more time before submission
    if (duplicateWarning && duplicateWarning.isBlocked) {
      toast.error('Cannot create contact: Phone number or email already exists');
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
        setDuplicateWarning(null);
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

          {/* Duplicate Warning */}
          {duplicateWarning && duplicateWarning.conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Duplicate Found - Cannot Create Contact
                  </h4>
                  <div className="space-y-2">
                    {duplicateWarning.conflicts.map((conflict, index) => (
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

          <div>
            <Label htmlFor="organisationId">Organisation</Label>
            <Select value={formData.organisationId || undefined} onValueChange={(value) => setFormData({ ...formData, organisationId: value || '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select organisation" />
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
          <LocationFieldGroup
            value={{
              country: formData.country,
              state: formData.state,
              city: formData.city
            }}
            onChange={(location) => setFormData({ ...formData, ...location })}
            required={true}
            layout="grid"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.firstName ||
                !formData.lastName ||
                !formData.type ||
                !formData.phone ||
                !formData.country ||
                (duplicateWarning && duplicateWarning.isBlocked)
              }
            >
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
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 overflow-hidden">
          {/* Header Section with Search and Actions */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-10 bg-background"
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-muted"
                    title="Clear search (Esc)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Clear All
                  </Button>
                )}
                {newContactButton}
              </div>
            </div>
          </div>

          {/* Basic Filters Section */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filters:</span>

              {/* Contact Type Filter */}
              <div className="min-w-[160px]">
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ContactType.CEO}>CEO</SelectItem>
                    <SelectItem value={ContactType.VP}>VP</SelectItem>
                    <SelectItem value={ContactType.SALES}>Sales</SelectItem>
                    <SelectItem value={ContactType.PURCHASING}>Purchasing</SelectItem>
                    <SelectItem value={ContactType.OPERATIONS}>Operations</SelectItem>
                    <SelectItem value={ContactType.LOGISTICS}>Logistics</SelectItem>
                    <SelectItem value={ContactType.FINANCE}>Finance</SelectItem>
                    <SelectItem value={ContactType.ACCOUNTING}>Accounting</SelectItem>
                    <SelectItem value={ContactType.MARKETING}>Marketing</SelectItem>
                    <SelectItem value={ContactType.ADMINISTRATION}>Administration</SelectItem>
                    <SelectItem value={ContactType.RETAIL_BUYER}>Retail Buyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organisation Filter */}
              <div className="min-w-[180px]">
                <Select
                  value={filters.organisationId || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, organisationId: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="h-9 text-sm">
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
              <div className="min-w-[160px]">
                <CountrySelector
                  value={filters.country}
                  onValueChange={(country) => {
                    console.log('🌍 Country selected:', country);
                    setFilters({ ...filters, country, state: '', city: '' });
                  }}
                  placeholder="Country"
                />
              </div>

              {/* State/Region Filter */}
              {filters.country && (
                <div className="min-w-[160px]">
                  <RegionSelector
                    countryCode={filters.country}
                    value={filters.state}
                    onValueChange={(state) => setFilters({ ...filters, state, city: '' })}
                    placeholder="State/Region"
                    disabled={!filters.country}
                  />
                </div>
              )}

              {/* City Filter */}
              {filters.state && (
                <div className="min-w-[160px]">
                  <CitySelector
                    countryCode={filters.country}
                    regionCode={filters.state}
                    value={filters.city}
                    onValueChange={(city) => setFilters({ ...filters, city })}
                    placeholder="City"
                    disabled={!filters.state}
                  />
                </div>
              )}
            </div>

            {/* Active Filter Summary */}
            {(searchQuery || filters.type || filters.organisationId || filters.country || filters.state || filters.city) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Active:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Search: "{searchQuery}"
                  </span>
                )}

                {filters.type && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Type: {getContactTypeLabel(filters.type)}
                  </span>
                )}

                {filters.organisationId && filters.organisationId !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Organisation: {getOrganisationName(filters.organisationId)}
                  </span>
                )}

                {filters.country && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Country: {filters.country}
                  </span>
                )}

                {filters.state && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    State: {filters.state}
                  </span>
                )}

                {filters.city && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    City: {filters.city}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
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
                    {contact.country ? (getCountryByCode(contact.country)?.name || contact.country) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(() => {
                        const emailMethod = contact.contactMethods?.find(method => method.type.includes('EMAIL'));
                        const phoneMethod = contact.contactMethods?.find(method => method.type.includes('PHONE'));

                        return (
                          <>
                            {emailMethod && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <a
                                  href={`mailto:${emailMethod.value}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                                  title={emailMethod.value}
                                >
                                  {emailMethod.value}
                                </a>
                              </div>
                            )}
                            {phoneMethod && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <a
                                  href={`tel:${phoneMethod.value}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                  title={phoneMethod.value}
                                >
                                  {phoneMethod.value}
                                </a>
                              </div>
                            )}
                            {!emailMethod && !phoneMethod && (
                              <span className="text-sm text-gray-400">No contact info</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const userId = contact.responsibleUserId || contact.assigneeId;
                      if (!userId) {
                        return <span className="text-sm text-gray-400">Unassigned</span>;
                      }
                      const userName = getUserName(userId);
                      const userInitials = getUserInitials(userId);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                            {userInitials}
                          </div>
                          <span className="text-sm">{userName}</span>
                        </div>
                      );
                    })()}
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