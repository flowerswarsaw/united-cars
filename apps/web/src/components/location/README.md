# Location Components

Standardized, reusable location selection components for the United Cars CRM system.

## Overview

These components provide a consistent interface for collecting and displaying location data across all CRM entities (Organizations, Contacts, Leads, etc.).

**Key Features:**
- ISO 3166-1 alpha-2 country codes for storage
- User-friendly full names for display
- Cascading dropdowns (Country → Region → City)
- Automatic validation
- Flexible customization
- Type-safe with TypeScript

## Components

### LocationFieldGroup

The easiest way to add location fields to a form. Combines Country, Region, and City selectors with optional address and postal code.

```tsx
import { LocationFieldGroup } from '@/components/location';

function MyForm() {
  const [location, setLocation] = useState({
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: ''
  });

  return (
    <LocationFieldGroup
      value={location}
      onChange={setLocation}
      showAddress={true}
      showZipCode={true}
      required={true}
      layout="grid" // or "vertical"
    />
  );
}
```

**Props:**
- `value`: LocationData object
- `onChange`: Callback when any field changes
- `showAddress`: Show street address field (default: false)
- `showZipCode`: Show postal code field (default: false)
- `required`: Mark all fields as required (default: false)
- `disabled`: Disable all fields (default: false)
- `layout`: 'grid' or 'vertical' (default: 'grid')
- `className`: Additional CSS classes

### CountrySelector

ISO 3166-1 alpha-2 country selection dropdown.

```tsx
import { CountrySelector } from '@/components/location';

function MyForm() {
  const [country, setCountry] = useState('');

  return (
    <CountrySelector
      value={country}
      onValueChange={setCountry}
      placeholder="Select country"
      showPopular={true}
    />
  );
}
```

**Props:**
- `value`: ISO country code (e.g., 'US', 'CA', 'GB')
- `onValueChange`: Callback when selection changes
- `placeholder`: Placeholder text
- `disabled`: Disable the selector
- `required`: Mark as required
- `className`: Additional CSS classes
- `showPopular`: Show popular countries section (default: true)

**Storage:** Stores 2-letter ISO code ('US')
**Display:** Shows full name ('United States')

### RegionSelector

State/Province/Region selection dropdown with country-dependent options.

```tsx
import { RegionSelector } from '@/components/location';

function MyForm() {
  const [country, setCountry] = useState('US');
  const [region, setRegion] = useState('');

  return (
    <RegionSelector
      countryCode={country}
      value={region}
      onValueChange={setRegion}
      placeholder="Select region"
      allowCustom={true}
    />
  );
}
```

**Props:**
- `countryCode`: ISO country code (required)
- `value`: Region/state code
- `onValueChange`: Callback when selection changes
- `placeholder`: Placeholder text
- `disabled`: Disable the selector
- `required`: Mark as required
- `className`: Additional CSS classes
- `allowCustom`: Allow text input for countries without predefined regions (default: true)

**Behavior:**
- Disabled until country is selected
- Shows dropdown if country has predefined regions
- Shows text input if country has no predefined regions (when allowCustom=true)
- Automatically resets when country changes

### CitySelector

City selection dropdown/input with region-dependent options.

```tsx
import { CitySelector } from '@/components/location';

function MyForm() {
  const [country, setCountry] = useState('US');
  const [region, setRegion] = useState('CA');
  const [city, setCity] = useState('');

  return (
    <CitySelector
      countryCode={country}
      regionCode={region}
      value={city}
      onValueChange={setCity}
      placeholder="Enter city"
      allowCustom={true}
    />
  );
}
```

**Props:**
- `countryCode`: ISO country code (required)
- `regionCode`: Region/state code (required)
- `value`: City name
- `onValueChange`: Callback when selection changes
- `placeholder`: Placeholder text
- `disabled`: Disable the selector
- `required`: Mark as required
- `className`: Additional CSS classes
- `allowCustom`: Allow custom city input (default: true)

**Behavior:**
- Disabled until region is selected
- Shows dropdown if region has predefined cities
- Shows text input if region has no predefined cities
- Includes option to switch between dropdown and custom input
- Automatically resets when region changes

## LocationService

Utility class for location operations.

```tsx
import { LocationService } from '@/lib/location-service';

// Get all countries
const countries = LocationService.getAllCountries();

// Get country by code
const country = LocationService.getCountry('US');
const countryName = LocationService.getCountryName('US'); // 'United States'

// Get regions for a country
const regions = LocationService.getRegions('US');
const regionName = LocationService.getRegionName('US', 'CA'); // 'California'

// Check if country has regions
const hasRegions = LocationService.hasRegions('US'); // true

// Get cities for a region
const cities = LocationService.getCities('US', 'CA');
const hasCities = LocationService.hasCities('US', 'CA'); // true

// Format location for display
const formatted = LocationService.formatLocationForDisplay({
  country: 'US',
  state: 'CA',
  city: 'Los Angeles'
});
// Output: "Los Angeles, California (CA), United States"

// Validate location
const validation = LocationService.validateLocation({
  country: 'US',
  state: 'CA',
  city: 'Los Angeles',
  zipCode: '90001'
});
// Returns: { isValid: true, errors: [] }

// Search countries
const results = LocationService.searchCountries('united');
// Returns countries matching 'united' in name or code

// Get popular countries
const popular = LocationService.getPopularCountries();
// Returns: ['US', 'CA', 'GB', 'AU', ...]
```

## Validation Schemas

Zod schemas for location validation (from `@united-cars/crm-core`):

```tsx
import {
  locationSchema,
  partialLocationSchema,
  minimalLocationSchema,
  fullAddressSchema,
  optionalFullAddressSchema,
  validateLocation
} from '@united-cars/crm-core';

// Validate complete location (all fields required)
const result = locationSchema.safeParse({
  country: 'US',
  state: 'CA',
  city: 'Los Angeles'
});

// Validate partial location (all fields optional)
const result2 = partialLocationSchema.safeParse({
  country: 'US'
});

// Validate minimal location (only country required)
const result3 = minimalLocationSchema.safeParse({
  country: 'US',
  state: 'CA'
});

// Validate full address
const result4 = fullAddressSchema.safeParse({
  address: '123 Main St',
  city: 'Los Angeles',
  state: 'CA',
  zipCode: '90001',
  country: 'US'
});

// Custom validation with country-specific rules
const validation = validateLocation({
  country: 'US',
  state: 'CA',
  zipCode: '90001'
});
// Returns: { valid: true, errors: [] }
```

## Data Flow

### Storage (API/Database)
```typescript
{
  country: 'US',        // ISO 3166-1 alpha-2 code
  state: 'CA',          // Region code (uppercase)
  city: 'Los Angeles',  // City name (as entered)
  zipCode: '90001'      // Normalized postal code
}
```

### Display (UI)
```typescript
{
  country: 'United States',      // Full country name
  state: 'California (CA)',      // Full region name with code
  city: 'Los Angeles',           // City name
  zipCode: '90001'               // Formatted postal code
}
```

### Normalization
Location data is automatically normalized at the API layer:
- Country names → ISO codes (e.g., "United States" → "US")
- Region codes → Uppercase (e.g., "ca" → "CA")
- Postal codes → Standard format per country

## Example: Organization Form

```tsx
import { useState } from 'react';
import { LocationFieldGroup, type LocationData } from '@/components/location';
import { normalizeCountryCode, normalizeRegionCode, normalizePostalCode } from '@/lib/country-validator';

function OrganizationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: {
      country: '',
      state: '',
      city: '',
      address: '',
      zipCode: ''
    } as LocationData
  });

  const handleLocationChange = (location: LocationData) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleSubmit = async () => {
    // Data is already normalized by the components
    const response = await fetch('/api/crm/organisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        ...formData.location // Spread normalized location data
      })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Organization Name</label>
        <input
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <LocationFieldGroup
        value={formData.location}
        onChange={handleLocationChange}
        showAddress={true}
        showZipCode={true}
        required={true}
        layout="grid"
      />

      <button type="submit">Create Organization</button>
    </form>
  );
}
```

## Migration Guide

### Before (Manual Implementation)

```tsx
// Old way - inconsistent implementation
<Select value={country} onValueChange={setCountry}>
  {COUNTRIES_REGIONS.countries.map(c => (
    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
  ))}
</Select>

<Select value={state} onValueChange={setState}>
  {getRegionsByCountryCode(country).map(r => (
    <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
  ))}
</Select>

<Input value={city} onChange={e => setCity(e.target.value)} />
```

### After (Using Components)

```tsx
// New way - consistent, standardized
<LocationFieldGroup
  value={{ country, state, city }}
  onChange={({ country, state, city }) => {
    setCountry(country);
    setState(state);
    setCity(city);
  }}
/>
```

## Best Practices

1. **Always use LocationFieldGroup** unless you need individual component control
2. **Store ISO codes** in the database, never full names
3. **Display full names** in the UI using LocationService
4. **Normalize at the API layer** using the provided normalization functions
5. **Validate using Zod schemas** from @united-cars/crm-core
6. **Reset dependent fields** when parent changes (handled automatically by components)
7. **Use TypeScript types** from the components for type safety

## Troubleshooting

### Country shows code instead of name
```tsx
// ❌ Wrong
<p>{org.country}</p> // Shows 'US'

// ✅ Correct
<p>{LocationService.getCountryName(org.country)}</p> // Shows 'United States'
```

### Region selector stays disabled
```tsx
// ❌ Wrong - not passing country code
<RegionSelector value={state} onValueChange={setState} />

// ✅ Correct
<RegionSelector countryCode={country} value={state} onValueChange={setState} />
```

### Location data not saving
```tsx
// ❌ Wrong - not normalizing
const data = { country: 'United States', state: 'california' };

// ✅ Correct - normalized automatically by components or manually
const data = {
  country: normalizeCountryCode('United States'), // → 'US'
  state: normalizeRegionCode('california')        // → 'CA'
};
```

## Support

For questions or issues:
1. Check this README
2. Review component source code
3. Check LocationService documentation
4. Review validator schemas in `@united-cars/crm-core`
