/**
 * LocationFieldGroup Component
 *
 * Complete location selector with:
 * - Country, Region/State, and City fields
 * - Cascading dropdowns (country → region → city)
 * - Automatic reset of dependent fields when parent changes
 * - Optional street address and postal code
 * - Consistent layout and spacing
 * - Form integration ready
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountrySelector } from './CountrySelector';
import { RegionSelector } from './RegionSelector';
import { CitySelector } from './CitySelector';
import { useState, useEffect } from 'react';

export interface LocationData {
  country: string;
  state: string;
  city: string;
  address?: string;
  zipCode?: string;
}

export interface LocationFieldGroupProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
  showAddress?: boolean;
  showZipCode?: boolean;
  required?: boolean;
  disabled?: boolean;
  layout?: 'vertical' | 'grid';
  className?: string;
}

export function LocationFieldGroup({
  value,
  onChange,
  showAddress = false,
  showZipCode = false,
  required = false,
  disabled = false,
  layout = 'grid',
  className = ''
}: LocationFieldGroupProps) {
  const [localValue, setLocalValue] = useState<LocationData>(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCountryChange = (country: string) => {
    const newValue = {
      ...localValue,
      country,
      state: '', // Reset state when country changes
      city: ''   // Reset city when country changes
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleStateChange = (state: string) => {
    const newValue = {
      ...localValue,
      state,
      city: '' // Reset city when state changes
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleCityChange = (city: string) => {
    const newValue = {
      ...localValue,
      city
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleAddressChange = (address: string) => {
    const newValue = {
      ...localValue,
      address
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleZipCodeChange = (zipCode: string) => {
    const newValue = {
      ...localValue,
      zipCode
    };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const gridClassName = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'space-y-4';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Street Address (optional, full width) */}
      {showAddress && (
        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            type="text"
            value={localValue.address || ''}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="123 Main Street"
            disabled={disabled}
            required={required}
            className="mt-1"
          />
        </div>
      )}

      {/* Country, State/Region, City, Zip Code */}
      <div className={gridClassName}>
        {/* Country */}
        <div>
          <Label htmlFor="country">
            Country {required && <span className="text-red-500">*</span>}
          </Label>
          <CountrySelector
            value={localValue.country}
            onValueChange={handleCountryChange}
            placeholder="Select country"
            disabled={disabled}
            required={required}
            className="mt-1"
          />
        </div>

        {/* State/Region */}
        <div>
          <Label htmlFor="state">
            State/Region {required && <span className="text-red-500">*</span>}
          </Label>
          <RegionSelector
            countryCode={localValue.country}
            value={localValue.state}
            onValueChange={handleStateChange}
            placeholder="Select region"
            disabled={disabled}
            required={required}
            className="mt-1"
          />
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">
            City {required && <span className="text-red-500">*</span>}
          </Label>
          <CitySelector
            countryCode={localValue.country}
            regionCode={localValue.state}
            value={localValue.city}
            onValueChange={handleCityChange}
            placeholder="Enter city"
            disabled={disabled}
            required={required}
            className="mt-1"
          />
        </div>

        {/* Postal/Zip Code (optional) */}
        {showZipCode && (
          <div>
            <Label htmlFor="zipCode">
              Postal Code {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="zipCode"
              type="text"
              value={localValue.zipCode || ''}
              onChange={(e) => handleZipCodeChange(e.target.value)}
              placeholder="12345"
              disabled={disabled}
              required={required}
              className="mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
