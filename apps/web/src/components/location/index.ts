/**
 * Location Components
 *
 * Standardized location selection components for CRM:
 * - CountrySelector: ISO 3166-1 country selection
 * - RegionSelector: State/province/region selection
 * - CitySelector: City selection with fallback to custom input
 * - LocationFieldGroup: Complete location form group
 */

export { CountrySelector } from './CountrySelector';
export type { CountrySelectorProps } from './CountrySelector';

export { RegionSelector } from './RegionSelector';
export type { RegionSelectorProps } from './RegionSelector';

export { CitySelector } from './CitySelector';
export type { CitySelectorProps } from './CitySelector';

export { LocationFieldGroup } from './LocationFieldGroup';
export type { LocationFieldGroupProps, LocationData } from './LocationFieldGroup';
