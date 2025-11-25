/**
 * CountrySelector Component
 *
 * Reusable country selection dropdown with:
 * - ISO 3166-1 alpha-2 country codes
 * - User-friendly country names
 * - Search/filter support
 * - Optional popular countries section
 * - Accessible keyboard navigation
 */

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationService } from '@/lib/location-service';
import { useMemo } from 'react';

export interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showPopular?: boolean;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = 'Select country',
  disabled = false,
  required = false,
  className,
  showPopular = true
}: CountrySelectorProps) {
  const countries = useMemo(() => LocationService.getAllCountries(), []);
  const popularCountryCodes = useMemo(() => LocationService.getPopularCountries(), []);

  const popularCountries = useMemo(() => {
    if (!showPopular) return [];
    return popularCountryCodes
      .map(code => countries.find(c => c.code === code))
      .filter(Boolean);
  }, [showPopular, popularCountryCodes, countries]);

  const otherCountries = useMemo(() => {
    if (!showPopular) return countries;
    return countries.filter(c => !popularCountryCodes.includes(c.code));
  }, [showPopular, countries, popularCountryCodes]);

  // Get display value
  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    const country = LocationService.getCountry(value);
    return country ? country.name : value;
  }, [value, placeholder]);

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
        {showPopular && popularCountries.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
              Popular Countries
            </div>
            {popularCountries.map(country => country && (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
            <div className="my-1 h-px bg-gray-200" />
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
              All Countries
            </div>
          </>
        )}
        {otherCountries.map(country => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
