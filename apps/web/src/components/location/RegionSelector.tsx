/**
 * RegionSelector Component
 *
 * Reusable region/state selection dropdown with:
 * - Country-dependent region list
 * - Automatic disable when country has no regions
 * - Fallback to text input for countries without predefined regions
 * - ISO region codes storage
 */

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LocationService } from '@/lib/location-service';
import { useMemo } from 'react';

export interface RegionSelectorProps {
  countryCode: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowCustom?: boolean; // Allow custom input for countries without predefined regions
  showAllOption?: boolean;
}

export function RegionSelector({
  countryCode,
  value,
  onValueChange,
  placeholder = 'Select region',
  disabled = false,
  required = false,
  className,
  allowCustom = true,
  showAllOption = false
}: RegionSelectorProps) {
  const hasRegions = useMemo(() => {
    if (!countryCode) return false;
    return LocationService.hasRegions(countryCode);
  }, [countryCode]);

  const regions = useMemo(() => {
    if (!countryCode || !hasRegions) return [];
    return LocationService.getRegions(countryCode);
  }, [countryCode, hasRegions]);

  // Get display value
  const displayValue = useMemo(() => {
    if (!value || value === 'all') return placeholder;
    if (!countryCode) return value;
    const regionName = LocationService.getRegionName(countryCode, value);
    return regionName || value;
  }, [value, countryCode, placeholder]);

  // If no country selected, show disabled dropdown
  if (!countryCode) {
    return (
      <Select disabled={true}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select country first" />
        </SelectTrigger>
      </Select>
    );
  }

  // If country has no predefined regions and custom input allowed, show text input
  if (!hasRegions && allowCustom) {
    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={className}
      />
    );
  }

  // If country has no predefined regions and custom input not allowed, show disabled dropdown
  if (!hasRegions && !allowCustom) {
    return (
      <Select disabled={true}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="No regions available" />
        </SelectTrigger>
      </Select>
    );
  }

  // Show region dropdown
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {displayValue}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <>
            <SelectItem value="all">All Regions</SelectItem>
            <div className="my-1 h-px bg-gray-200" />
          </>
        )}
        {regions.map(region => (
          <SelectItem key={region.code} value={region.code}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
