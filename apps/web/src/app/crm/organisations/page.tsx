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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  Globe,
  X
} from 'lucide-react';
import { Organisation, OrganizationType } from '@united-cars/crm-core';
import toast from 'react-hot-toast';

interface OrganisationFilters {
  type: string;
  country: string;
}

// Helper function to escape regex special characters
const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function OrganisationsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<OrganisationFilters>({
    type: '',
    country: ''
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    type: OrganizationType.RETAIL_CLIENT,
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: '',
    city: '',
    state: '',
    country: ''
  });

  const loadOrganisations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      
      if (filters.country.trim()) {
        params.append('country', filters.country.trim());
      }
      
      const url = params.toString() 
        ? `/api/crm/organisations?${params.toString()}`
        : '/api/crm/organisations';
      
      const response = await fetch(url);
      const data = await response.json();
      setOrganisations(data || []);
    } catch (error) {
      console.error('Failed to load organisations:', error);
      toast.error('Failed to load organisations');
      setOrganisations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.type, filters.country]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOrganisations();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadOrganisations]);

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

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/crm/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsCreateOpen(false);
        setFormData({
          name: '',
          companyId: '',
          type: OrganizationType.RETAIL_CLIENT,
          email: '',
          phone: '',
          website: '',
          industry: '',
          size: '',
          city: '',
          state: '',
          country: ''
        });
        loadOrganisations();
        toast.success(`Organisation created: ${formData.name}`);
      }
    } catch (error) {
      console.error('Failed to create organisation:', error);
      toast.error('Failed to create organisation');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      type: '',
      country: ''
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery || 
    (filters.type && filters.type !== 'all') ||
    filters.country
  );


  if (sessionLoading || !user || loading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="Organisations"
          description="Manage your companies and accounts"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Organisations' }]}
        />
        <LoadingState text="Loading organisations..." />
      </AppLayout>
    );
  }

  const newOrgButton = (

    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Organisation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Organisation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyId">Company ID *</Label>
                  <Input
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    placeholder="COMP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Organization Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as OrganizationType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
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
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
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
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Automotive"
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="50-100"
                  />
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
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name || !formData.companyId || !formData.type}>
                  Create Organisation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  );

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Organisations"
        description="Manage your companies and accounts"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Organisations' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-4 w-4" />
                <Input
                  placeholder="Search by name, company ID, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Organisation Type Filter */}
              <div className="min-w-[180px]">
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={OrganizationType.RETAIL_CLIENT}>Retail Client</SelectItem>
                    <SelectItem value={OrganizationType.DEALER}>Dealer</SelectItem>
                    <SelectItem value={OrganizationType.EXPEDITOR}>Expeditor</SelectItem>
                    <SelectItem value={OrganizationType.SHIPPER}>Shipper</SelectItem>
                    <SelectItem value={OrganizationType.TRANSPORTER}>Transporter</SelectItem>
                    <SelectItem value={OrganizationType.AUCTION}>Auction House</SelectItem>
                    <SelectItem value={OrganizationType.PROCESSOR}>Processor</SelectItem>
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
              
              {/* New Organisation Button */}
              <div className="flex-shrink-0">
                {newOrgButton}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <Building2 className="h-12 w-12 text-text-tertiary" />
                    <div className="text-text-secondary">
                      {hasActiveFilters ? 'No organisations match your filters' : 'No organisations found'}
                    </div>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="text-sm">
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              organisations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Link 
                      href={`/crm/organisations/${org.id}`}
                      className="font-medium text-primary hover:underline flex items-center"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span dangerouslySetInnerHTML={{ 
                        __html: searchQuery 
                          ? org.name.replace(
                              new RegExp(`(${escapeRegex(searchQuery)})`, 'gi'),
                              '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
                            )
                          : org.name
                      }} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono bg-surface-100 px-2 py-1 rounded">
                      {org.companyId || '-'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {org.type.toLowerCase().replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {org.country || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {org.email && (
                        <a href={`mailto:${org.email}`} className="text-text-secondary hover:text-foreground">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {org.phone && (
                        <a href={`tel:${org.phone}`} className="text-text-secondary hover:text-foreground">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-foreground">
                          <Globe className="h-4 w-4" />
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
      </div>
    </AppLayout>
  );
}