"use client";

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string; // For mobile responsive design
}

export interface DataTableFilter {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  onFiltersChange?: (filters: Record<string, string>) => void;
  onCreateClick?: () => void;
  createButtonText?: string;
  emptyStateText?: string;
  emptyStateSubtext?: string;
  title?: string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onFiltersChange,
  onCreateClick,
  createButtonText = 'Create New',
  emptyStateText = 'No data found',
  emptyStateSubtext = 'Get started by creating your first item.',
  title,
  className = ''
}: DataTableProps<T>) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearchQuery);
      onSearchChange?.(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearchChange]);

  // Sync external search query
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    if (value === '' || value === 'all') {
      delete newFilters[key];
    }
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(localFilters).length > 0;

  // Clear all filters
  const clearFilters = () => {
    setLocalFilters({});
    setLocalSearchQuery('');
    onFiltersChange?.({});
    onSearchChange?.('');
  };

  // Responsive table for mobile
  const MobileCard = ({ item, index }: { item: T; index: number }) => (
    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      {columns.map((column) => {
        if (column.key === 'actions') return null; // Handle actions separately
        const value = column.render ? column.render(item) : String(item[column.key as keyof T] || '');
        return (
          <div key={String(column.key)} className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500 min-w-[80px]">
              {column.mobileLabel || column.label}:
            </span>
            <div className="text-sm text-gray-900 text-right flex-1 ml-2">
              {value}
            </div>
          </div>
        );
      })}
      {/* Actions for mobile */}
      {columns.find(col => col.key === 'actions') && (
        <div className="pt-3 border-t border-gray-100">
          {columns.find(col => col.key === 'actions')?.render?.(item)}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {localSearchQuery && (
              <button
                onClick={() => {
                  setLocalSearchQuery('');
                  onSearchChange?.('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Toggle */}
          {filters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {Object.keys(localFilters).length}
                </Badge>
              )}
              {filtersVisible ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          )}

          {/* Create Button */}
          {onCreateClick && (
            <Button onClick={onCreateClick} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {createButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {filters.length > 0 && filtersVisible && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            {filters.map((filter) => (
              <div key={filter.key} className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <Select
                    value={localFilters[filter.key] || ''}
                    onValueChange={(value) => handleFilterChange(filter.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`All ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    placeholder={filter.placeholder}
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  />
                )}
              </div>
            ))}
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-8">
          <LoadingState text="Loading data..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium">{emptyStateText}</p>
            <p className="text-sm text-gray-400 mt-1">{emptyStateSubtext}</p>
          </div>
          {onCreateClick && (
            <Button onClick={onCreateClick} className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              {createButtonText}
            </Button>
          )}
        </div>
      )}

      {/* Data Table - Desktop */}
      {!loading && data.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.key)}
                      className={`font-semibold text-gray-900 ${column.className || ''}`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={column.className || ''}
                      >
                        {column.render ? column.render(item) : String(item[column.key as keyof T] || '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {data.map((item, index) => (
              <MobileCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}