/**
 * CitySelector Component
 *
 * Reusable city selection dropdown with:
 * - Country and region-dependent city list
 * - Automatic disable when region has no predefined cities
 * - Fallback to text input for regions without predefined cities
 * - Support for custom city input
 */

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LocationService } from '@/lib/location-service';
import { useMemo, useState, useEffect } from 'react';

export interface CitySelectorProps {
  countryCode: string;
  regionCode: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowCustom?: boolean; // Allow custom input when no predefined cities
}

export function CitySelector({
  countryCode,
  regionCode,
  value,
  onValueChange,
  placeholder = 'Enter city',
  disabled = false,
  required = false,
  className,
  allowCustom = true
}: CitySelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const hasCities = useMemo(() => {
    if (!countryCode || !regionCode) return false;
    return LocationService.hasCities(countryCode, regionCode);
  }, [countryCode, regionCode]);

  const cities = useMemo(() => {
    if (!countryCode || !regionCode || !hasCities) return [];
    return LocationService.getCities(countryCode, regionCode);
  }, [countryCode, regionCode, hasCities]);

  // Reset to custom input when region changes and new region has no predefined cities
  useEffect(() => {
    if (!hasCities && allowCustom) {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  }, [hasCities, allowCustom]);

  // If no region selected, show disabled input
  if (!regionCode) {
    return (
      <Input
        type="text"
        value=""
        placeholder="Select region first"
        disabled={true}
        className={className}
      />
    );
  }

  // If region has no predefined cities and custom input allowed, show text input
  if (!hasCities && allowCustom) {
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

  // If region has no predefined cities and custom input not allowed, show disabled input
  if (!hasCities && !allowCustom) {
    return (
      <Input
        type="text"
        value=""
        placeholder="No cities available"
        disabled={true}
        className={className}
      />
    );
  }

  // If user wants to enter custom city, show text input
  if (showCustomInput) {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={className}
        />
        <button
          type="button"
          onClick={() => setShowCustomInput(false)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          Choose from list
        </button>
      </div>
    );
  }

  // Show city dropdown with option to enter custom
  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {value || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cities.map(city => (
            <SelectItem key={city.name} value={city.name}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {allowCustom && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          Enter custom city
        </button>
      )}
    </div>
  );
}
