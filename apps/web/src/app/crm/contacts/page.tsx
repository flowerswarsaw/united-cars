"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  X
} from 'lucide-react';
import { Contact, Organisation } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

interface ContactFilters {
  organisationId: string;
  country: string;
}

// Helper function to escape regex special characters
const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function ContactsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ContactFilters>({
    organisationId: '',
    country: ''
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    organisationId: '',
    city: '',
    state: '',
    country: ''
  });

  useEffect(() => {
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
    // Auto-open creation dialog if create parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setIsCreateOpen(true);
      // Remove the parameter from URL without refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const loadOrganisations = async () => {
    try {
      const data = await fetch('/api/crm/organisations').then(r => r.json());
      setOrganisations(data);
    } catch (error) {
      console.error('Failed to load organisations:', error);
      toast.error('Failed to load organisations');
    }
  };

  const handleCreate = async () => {
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
          title: '',
          organisationId: '',
          city: '',
          state: '',
          country: ''
        });
        loadContacts();
        toast.success(`Contact created: ${formData.firstName} ${formData.lastName}`);
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    }
  };

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
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
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0100"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Sales Manager"
                  />
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
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.firstName || !formData.lastName}>
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
        actions={newContactButton}
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
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
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
                  <TableCell>{contact.title || '-'}</TableCell>
                  <TableCell>
                    {contact.organisationId ? (
                      <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                        {getOrganisationName(contact.organisationId) || 'Unknown'}
                      </div>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </AppLayout>
  );
}