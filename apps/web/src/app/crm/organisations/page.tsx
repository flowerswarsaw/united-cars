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
import { COUNTRIES_REGIONS, getCountryByCode, getRegionsByCountryCode, hasRegions, getRegionDisplayName, getCitiesByRegion, hasCities } from '@/lib/countries-regions';
import { LocationFieldGroup, CountrySelector, RegionSelector, CitySelector } from '@/components/location';
import { TypeSpecificFilterPanel, TypeSpecificFilterValue } from '@/components/crm/filters';
import toast from 'react-hot-toast';

interface OrganisationFilters {
  type: string;
  country: string;
  state: string;
  city: string;
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
    country: '',
    state: '',
    city: ''
  });
  const [pendingTypeFilters, setPendingTypeFilters] = useState<Record<string, TypeSpecificFilterValue>>({});
  const [appliedTypeFilters, setAppliedTypeFilters] = useState<Record<string, TypeSpecificFilterValue>>({});
  const [isTypeFilterExpanded, setIsTypeFilterExpanded] = useState(false);
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

  // Load organisations function
  const loadOrganisations = useCallback(async () => {
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

      if (filters.state.trim()) {
        params.append('state', filters.state.trim());
      }

      if (filters.city.trim()) {
        params.append('city', filters.city.trim());
      }

      // Add type-specific filters to query params
      if (Object.keys(appliedTypeFilters).length > 0) {
        params.append('typeFilters', JSON.stringify(appliedTypeFilters));
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
  }, [debouncedSearchQuery, filters.type, filters.country, filters.state, filters.city, appliedTypeFilters]);

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
    loadOrganisations();
  }, [loadOrganisations]);

  // Reset type-specific filters when organization type changes
  useEffect(() => {
    setPendingTypeFilters({});
    setAppliedTypeFilters({});
  }, [filters.type]);

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
      country: '',
      state: '',
      city: ''
    });
    setPendingTypeFilters({});
    setAppliedTypeFilters({});
  };

  // Type-specific filter handlers
  const handleTypeFilterChange = (fieldKey: string, value: TypeSpecificFilterValue) => {
    setPendingTypeFilters(prev => {
      // Check if the filter is empty and should be removed
      const isEmpty =
        (!value.value || value.value === '') &&
        (!value.values || value.values.length === 0) &&
        value.min === undefined &&
        value.max === undefined &&
        (!value.from || value.from === '') &&
        (!value.to || value.to === '') &&
        (value.boolValue === null || value.boolValue === undefined);

      // If empty, remove the filter; otherwise update it
      if (isEmpty) {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [fieldKey]: value
      };
    });
  };

  const handleApplyTypeFilters = () => {
    setAppliedTypeFilters(pendingTypeFilters);
  };

  const handleClearTypeFilters = () => {
    setPendingTypeFilters({});
    setAppliedTypeFilters({});
  };

  // Check if there are unapplied changes
  const hasUnappliedChanges = JSON.stringify(pendingTypeFilters) !== JSON.stringify(appliedTypeFilters);

  const hasActiveFilters = Boolean(
    searchQuery ||
    (filters.type && filters.type !== 'all') ||
    filters.country ||
    filters.state ||
    filters.city ||
    Object.keys(appliedTypeFilters).length > 0
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
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6 overflow-hidden">
          {/* Header Section with Search and Actions */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search organisations..."
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
                {newOrgButton}
              </div>
            </div>
          </div>

          {/* Basic Filters Section */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground mr-2">Filters:</span>

              {/* Organisation Type Filter */}
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
              <div className="min-w-[160px]">
                <CountrySelector
                  value={filters.country}
                  onValueChange={(country) => setFilters({ ...filters, country, state: '', city: '' })}
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
            {(searchQuery || filters.type || filters.country || filters.state || filters.city || Object.keys(appliedTypeFilters).length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Active:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Search: "{searchQuery}"
                  </span>
                )}

                {filters.type && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Type: {filters.type}
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

                {Object.keys(appliedTypeFilters).length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium">
                    Advanced: {Object.keys(appliedTypeFilters).length} filter{Object.keys(appliedTypeFilters).length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Type-Specific Filters Section */}
          {filters.type && filters.type !== 'all' && (
            <div className="border-t border-border">
              <TypeSpecificFilterPanel
                organizationType={filters.type as OrganizationType}
                pendingFilters={pendingTypeFilters}
                onFilterChange={handleTypeFilterChange}
                onApply={handleApplyTypeFilters}
                onClear={handleClearTypeFilters}
                hasUnappliedChanges={hasUnappliedChanges}
                isExpanded={isTypeFilterExpanded}
                onToggle={() => setIsTypeFilterExpanded(!isTypeFilterExpanded)}
              />
            </div>
          )}
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
                    {org.country ? (getCountryByCode(org.country)?.name || org.country) : '-'}
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