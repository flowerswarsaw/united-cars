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
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Organisation, OrganizationType, ContactMethodType } from '@united-cars/crm-core';
import { COUNTRIES_REGIONS, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<OrganisationFilters>({
    type: '',
    country: ''
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    type: OrganizationType.RETAIL_CLIENT,
    phone: '',
    email: '',
    website: '',
    size: '',
    country: '',
    state: '',
    city: ''
  });
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isBlocked: boolean;
    conflicts: Array<{
      type: 'email' | 'phone' | 'companyId';
      value: string;
      existingEntity: {
        id: string;
        type: 'lead' | 'contact' | 'organisation';
        name: string;
        details?: string;
      };
    }>;
    warnings: Array<{
      type: 'companyName';
      value: string;
      existingEntities: Array<{
        id: string;
        type: 'organisation';
        name: string;
        details?: string;
      }>;
    }>;
  } | null>(null);

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearchQuery]);

  // Load organisations when debounced query or filters change
  useEffect(() => {
    const loadOrganisations = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (debouncedSearchQuery.trim()) {
          params.append('search', debouncedSearchQuery.trim());
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
        setInitialLoading(false);
      }
    };

    loadOrganisations();
  }, [debouncedSearchQuery, filters.type, filters.country]);

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

  const checkDuplicates = async (name?: string, companyId?: string, email?: string, phone?: string) => {
    if (!name && !companyId && !email && !phone) {
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
          entityType: 'organisation',
          data: {
            name,
            companyId,
            contactMethods
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.conflicts.length > 0 || result.warnings.length > 0) {
          setDuplicateWarning(result);
        } else {
          setDuplicateWarning(null);
        }
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDuplicates(
        formData.name || undefined,
        formData.companyId || undefined,
        formData.email || undefined,
        formData.phone || undefined
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name, formData.companyId, formData.email, formData.phone]);

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.name || !formData.companyId || !formData.type || !formData.country) {
      alert('Please fill in all required fields: Name, Company ID, Type, and Country');
      return;
    }

    // Check for blocking duplicates (company ID, email, phone)
    if (duplicateWarning && duplicateWarning.isBlocked) {
      toast.error('Cannot create organisation: Company ID, phone number or email already exists');
      return;
    }

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
          phone: '',
          email: '',
          website: '',
          size: '',
          country: '',
          state: '',
          city: ''
        });
        setShowCustomCity(false);
        setDuplicateWarning(null);
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

  const handleDelete = async (org: Organisation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete the organization "${org.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/organisations/${org.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Organization deleted successfully');
        loadOrganisations();
      } else {
        toast.error('Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
    }
  };


  if (sessionLoading || !user || initialLoading) {
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
              {/* Basic Information */}
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
                    <SelectItem value={OrganizationType.BROKER}>Broker</SelectItem>
                    <SelectItem value={OrganizationType.EXPEDITOR}>Expeditor</SelectItem>
                    <SelectItem value={OrganizationType.SHIPPER}>Shipper</SelectItem>
                    <SelectItem value={OrganizationType.TRANSPORTER}>Transporter</SelectItem>
                    <SelectItem value={OrganizationType.AUCTION}>Auction House</SelectItem>
                    <SelectItem value={OrganizationType.PROCESSOR}>Processor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (duplicateWarning.conflicts.length > 0 || duplicateWarning.warnings.length > 0) && (
                <div className="space-y-3">
                  {/* Blocking Conflicts */}
                  {duplicateWarning.conflicts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-2">
                            Duplicate Found - Cannot Create Organisation
                          </h4>
                          <div className="space-y-2">
                            {duplicateWarning.conflicts.map((conflict, index) => (
                              <div key={index} className="text-sm text-red-700">
                                <strong>{conflict.type.replace('Id', ' ID').toUpperCase()}:</strong> {conflict.value} already exists for{' '}
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

                  {/* Non-blocking Warnings */}
                  {duplicateWarning.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800 mb-2">
                            Similar Organisation Names Found
                          </h4>
                          <div className="space-y-2">
                            {duplicateWarning.warnings.map((warning, index) => (
                              <div key={index} className="text-sm text-yellow-700">
                                <strong>Company Name:</strong> "{warning.value}" already exists for{' '}
                                {warning.existingEntities.map((entity, entityIndex) => (
                                  <span key={entityIndex}>
                                    <span className="font-medium">{entity.name}</span>
                                    {entity.details && <span className="text-yellow-600"> ({entity.details})</span>}
                                    {entityIndex < warning.existingEntities.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            ))}
                            <div className="text-xs text-yellow-600 mt-1">
                              This is just a warning - you can still create the organisation.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="50-100"
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value, state: '', city: '' })}
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
                <Button
                  onClick={handleCreate}
                  disabled={
                    !formData.name ||
                    !formData.companyId ||
                    !formData.type ||
                    !formData.country ||
                    (duplicateWarning && duplicateWarning.isBlocked)
                  }
                >
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
                  className="pl-10 pr-8"
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-foreground transition-colors"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <div className="h-3 w-3 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
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
                    <SelectItem value={OrganizationType.BROKER}>Broker</SelectItem>
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
              <TableHead>Contact Info</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
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
                    <div className="space-y-1">
                      {(() => {
                        // Extract contact info from contactMethods array or fallback to direct properties
                        const emailMethod = org.contactMethods?.find(method => method.type.includes('EMAIL'));
                        const phoneMethod = org.contactMethods?.find(method => method.type.includes('PHONE'));
                        const email = emailMethod?.value || org.email;
                        const phone = phoneMethod?.value || org.phone;

                        return (
                          <>
                            {email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <a
                                  href={`mailto:${email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                                  title={email}
                                >
                                  {email}
                                </a>
                              </div>
                            )}
                            {phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <a
                                  href={`tel:${phone}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                  title={phone}
                                >
                                  {phone}
                                </a>
                              </div>
                            )}
                            {!email && !phone && (
                              <span className="text-sm text-gray-400">No contact info</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(org, e)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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