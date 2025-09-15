'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Save, 
  RotateCcw,
  Star,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { UserRole } from '@united-cars/crm-core/src/rbac';
import { OrganizationType, LeadStatus, DealStatus, LeadSource } from '@united-cars/crm-core';

export interface SearchFilters {
  // Global search
  searchTerm?: string;
  
  // Entity-specific filters
  entityType?: 'organisations' | 'contacts' | 'deals' | 'leads' | 'all';
  
  // Organization filters
  organisationType?: OrganizationType;
  industry?: string;
  size?: string;
  location?: string;
  verified?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  
  // Contact filters
  role?: string;
  organisationId?: string;
  hasSocialMedia?: boolean;
  
  // Deal filters
  dealStatus?: DealStatus;
  pipelineId?: string;
  stageId?: string;
  minValue?: number;
  maxValue?: number;
  minProbability?: number;
  maxProbability?: number;
  
  // Lead filters
  leadStatus?: LeadStatus;
  leadSource?: LeadSource;
  minLeadScore?: number;
  maxLeadScore?: number;
  engagementLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Assignment filters
  assignedUserId?: string;
  unassigned?: boolean;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  
  // Status filters
  overdue?: boolean;
  needsFollowUp?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilters;
  isDefault?: boolean;
  createdAt: Date;
  userRole: UserRole;
}

export interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  userRole: UserRole;
  currentUserId: string;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: SearchFilters) => void;
  onLoadFilter?: (savedFilter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  availableUsers?: Array<{ id: string; name: string }>;
  availablePipelines?: Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>;
  className?: string;
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  userRole,
  currentUserId,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  availableUsers = [],
  availablePipelines = [],
  className
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  // Count active filters
  useEffect(() => {
    const count = Object.entries(filters).filter(([key, value]) => {
      if (key === 'searchTerm' || key === 'entityType') return false;
      return value !== undefined && value !== '' && value !== null;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Update filters helper
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange({
      searchTerm: filters.searchTerm,
      entityType: filters.entityType
    });
  }, [filters.searchTerm, filters.entityType, onFiltersChange]);

  // Handle saved filter operations
  const handleSaveFilter = () => {
    if (onSaveFilter && saveFilterName.trim()) {
      onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    if (onLoadFilter) {
      onLoadFilter(savedFilter);
    }
  };

  // Get available stages for selected pipeline
  const getAvailableStages = () => {
    if (!filters.pipelineId) return [];
    const pipeline = availablePipelines.find(p => p.id === filters.pipelineId);
    return pipeline?.stages || [];
  };

  // Filter options based on entity type
  const getEntitySpecificFilters = () => {
    switch (filters.entityType) {
      case 'organisations':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organisationType">Organization Type</Label>
                <Select
                  value={filters.organisationType || ''}
                  onValueChange={(value) => updateFilter('organisationType', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    {Object.values(OrganizationType).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={filters.industry || ''}
                  onChange={(e) => updateFilter('industry', e.target.value || undefined)}
                  placeholder="e.g., Auto Sales"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.verified || false}
                  onCheckedChange={(checked) => updateFilter('verified', checked || undefined)}
                />
                <Label htmlFor="verified">Verified only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={filters.hasEmail || false}
                  onCheckedChange={(checked) => updateFilter('hasEmail', checked || undefined)}
                />
                <Label htmlFor="hasEmail">Has email</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhone"
                  checked={filters.hasPhone || false}
                  onCheckedChange={(checked) => updateFilter('hasPhone', checked || undefined)}
                />
                <Label htmlFor="hasPhone">Has phone</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWebsite"
                  checked={filters.hasWebsite || false}
                  onCheckedChange={(checked) => updateFilter('hasWebsite', checked || undefined)}
                />
                <Label htmlFor="hasWebsite">Has website</Label>
              </div>
            </div>
          </div>
        );

      case 'deals':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dealStatus">Status</Label>
                <Select
                  value={filters.dealStatus || ''}
                  onValueChange={(value) => updateFilter('dealStatus', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    {Object.values(DealStatus).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pipelineId">Pipeline</Label>
                <Select
                  value={filters.pipelineId || ''}
                  onValueChange={(value) => {
                    updateFilter('pipelineId', value || undefined);
                    updateFilter('stageId', undefined); // Reset stage when pipeline changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any pipeline</SelectItem>
                    {availablePipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filters.pipelineId && (
              <div>
                <Label htmlFor="stageId">Stage</Label>
                <Select
                  value={filters.stageId || ''}
                  onValueChange={(value) => updateFilter('stageId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any stage</SelectItem>
                    {getAvailableStages().map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minValue">Min Value ($)</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={filters.minValue || ''}
                  onChange={(e) => updateFilter('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="maxValue">Max Value ($)</Label>
                <Input
                  id="maxValue"
                  type="number"
                  value={filters.maxValue || ''}
                  onChange={(e) => updateFilter('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leadStatus">Status</Label>
                <Select
                  value={filters.leadStatus || ''}
                  onValueChange={(value) => updateFilter('leadStatus', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any status</SelectItem>
                    {Object.values(LeadStatus).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="leadSource">Source</Label>
                <Select
                  value={filters.leadSource || ''}
                  onValueChange={(value) => updateFilter('leadSource', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any source</SelectItem>
                    {Object.values(LeadSource).map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minLeadScore">Min Lead Score</Label>
                <Input
                  id="minLeadScore"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minLeadScore || ''}
                  onChange={(e) => updateFilter('minLeadScore', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="maxLeadScore">Max Lead Score</Label>
                <Input
                  id="maxLeadScore"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxLeadScore || ''}
                  onChange={(e) => updateFilter('maxLeadScore', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="engagementLevel">Engagement Level</Label>
              <Select
                value={filters.engagementLevel || ''}
                onValueChange={(value) => updateFilter('engagementLevel', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any level</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filters
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onSaveFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={activeFiltersCount === 0}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Main search bar */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search across all entities..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="text-base"
            />
          </div>
          
          <Select
            value={filters.entityType || 'all'}
            onValueChange={(value) => updateFilter('entityType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="organisations">Organizations</SelectItem>
              <SelectItem value="contacts">Contacts</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={onSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Saved filters */}
            {savedFilters.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Saved Filters</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedFilters.map(savedFilter => (
                    <div key={savedFilter.id} className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadFilter(savedFilter)}
                        className="gap-1"
                      >
                        {savedFilter.isDefault && <Star className="h-3 w-3 fill-current" />}
                        {savedFilter.name}
                      </Button>
                      {onDeleteFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteFilter(savedFilter.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedUserId">Assigned User</Label>
                  <Select
                    value={filters.assignedUserId || ''}
                    onValueChange={(value) => updateFilter('assignedUserId', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any user</SelectItem>
                      <SelectItem value={currentUserId}>Me</SelectItem>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unassigned"
                      checked={filters.unassigned || false}
                      onCheckedChange={(checked) => updateFilter('unassigned', checked || undefined)}
                    />
                    <Label htmlFor="unassigned">Unassigned only</Label>
                  </div>
                </div>
              </div>
              
              {/* Date range filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created After</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdAfter ? format(filters.createdAfter, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdAfter}
                        onSelect={(date) => updateFilter('createdAfter', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Created Before</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdBefore ? format(filters.createdBefore, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdBefore}
                        onSelect={(date) => updateFilter('createdBefore', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Entity-specific filters */}
            {getEntitySpecificFilters() && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">
                    {filters.entityType ? `${filters.entityType} Filters` : 'Entity Filters'}
                  </Label>
                  <div className="mt-3">
                    {getEntitySpecificFilters()}
                  </div>
                </div>
              </>
            )}

            {/* Special status filters */}
            <Separator />
            <div>
              <Label className="text-sm font-medium">Special Filters</Label>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue"
                    checked={filters.overdue || false}
                    onCheckedChange={(checked) => updateFilter('overdue', checked || undefined)}
                  />
                  <Label htmlFor="overdue">Overdue items</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needsFollowUp"
                    checked={filters.needsFollowUp || false}
                    onCheckedChange={(checked) => updateFilter('needsFollowUp', checked || undefined)}
                  />
                  <Label htmlFor="needsFollowUp">Needs follow-up</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Save filter dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Save Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="saveFilterName">Filter Name</Label>
                <Input
                  id="saveFilterName"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="e.g., High-value deals"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>
                  Save Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}