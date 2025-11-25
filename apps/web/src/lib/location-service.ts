/**
 * Location Service
 *
 * Centralized service for handling all location-related operations:
 * - Country/region/city data retrieval
 * - Data normalization (input → ISO codes)
 * - Display formatting (ISO codes → user-friendly names)
 * - Cascading dropdown support
 *
 * Modern CRM Standard:
 * - Store ISO codes (US, CA, GB)
 * - Display full names (United States, Canada, United Kingdom)
 * - Validate region codes against country
 * - Support cascading dropdowns (Country → Region → City)
 */

import {
  COUNTRIES_REGIONS,
  getCountryByCode,
  getRegionsByCountryCode,
  getRegionByCode,
  getCitiesByRegion,
  hasRegions,
  hasCities,
  getRegionDisplayName,
  Country,
  Region
} from './countries-regions';

export interface LocationData {
  country: string;
  state?: string;
  city?: string;
  zipCode?: string;
}

export interface CountryOption {
  code: string;
  name: string;
  label: string; // Formatted for display
}

export interface RegionOption {
  code: string;
  name: string;
  label: string;
}

export interface CityOption {
  name: string;
  label: string;
}

/**
 * LocationService - Main service class for location operations
 */
export class LocationService {
  /**
   * Get all countries as select options
   */
  static getAllCountries(): CountryOption[] {
    return COUNTRIES_REGIONS.countries.map(country => ({
      code: country.code,
      name: country.name,
      label: `${country.name} (${country.code})`
    }));
  }

  /**
   * Get country by code
   */
  static getCountry(code: string): Country | undefined {
    if (!code) return undefined;
    return getCountryByCode(code.toUpperCase());
  }

  /**
   * Get country name from code
   */
  static getCountryName(code: string): string {
    if (!code) return '';
    const country = this.getCountry(code);
    return country ? country.name : code;
  }

  /**
   * Get regions for a country
   */
  static getRegions(countryCode: string): RegionOption[] {
    if (!countryCode) return [];

    const regions = getRegionsByCountryCode(countryCode);
    return regions.map(region => ({
      code: region.code,
      name: region.name,
      label: `${region.name} (${region.code})`
    }));
  }

  /**
   * Get region by code for a specific country
   */
  static getRegion(countryCode: string, regionCode: string): Region | undefined {
    if (!countryCode || !regionCode) return undefined;
    return getRegionByCode(countryCode, regionCode);
  }

  /**
   * Get region name from code
   */
  static getRegionName(countryCode: string, regionCode: string): string {
    if (!countryCode || !regionCode) return '';
    return getRegionDisplayName(countryCode, regionCode);
  }

  /**
   * Check if a country has regions defined
   */
  static hasRegions(countryCode: string): boolean {
    if (!countryCode) return false;
    return hasRegions(countryCode);
  }

  /**
   * Get cities for a region
   */
  static getCities(countryCode: string, regionCode: string): CityOption[] {
    if (!countryCode || !regionCode) return [];

    const cities = getCitiesByRegion(countryCode, regionCode);
    return cities.map(city => ({
      name: city,
      label: city
    }));
  }

  /**
   * Check if a region has cities defined
   */
  static hasCities(countryCode: string, regionCode: string): boolean {
    if (!countryCode || !regionCode) return false;
    return hasCities(countryCode, regionCode);
  }

  /**
   * Format location data for display
   *
   * @param location - Location data with ISO codes
   * @returns Formatted address string
   *
   * Example:
   * Input: { country: 'US', state: 'CA', city: 'Los Angeles' }
   * Output: "Los Angeles, California (CA), United States"
   */
  static formatLocationForDisplay(location: LocationData): string {
    if (!location) return '';

    const parts: string[] = [];

    // Add city
    if (location.city) {
      parts.push(location.city);
    }

    // Add region/state
    if (location.state && location.country) {
      const regionName = this.getRegionName(location.country, location.state);
      if (regionName) {
        parts.push(`${regionName} (${location.state})`);
      } else {
        parts.push(location.state);
      }
    }

    // Add country
    if (location.country) {
      const countryName = this.getCountryName(location.country);
      if (countryName) {
        parts.push(countryName);
      }
    }

    return parts.join(', ');
  }

  /**
   * Format address for compact display (single line)
   *
   * Example: "Los Angeles, CA, USA"
   */
  static formatLocationCompact(location: LocationData): string {
    if (!location) return '';

    const parts: string[] = [];

    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.join(', ');
  }

  /**
   * Format full address including street
   */
  static formatFullAddress(
    address: string,
    location: LocationData
  ): string {
    const parts: string[] = [];

    if (address) parts.push(address);
    if (location.city) parts.push(location.city);
    if (location.state) {
      const regionName = this.getRegionName(location.country || '', location.state);
      parts.push(regionName || location.state);
    }
    if (location.zipCode) parts.push(location.zipCode);
    if (location.country) {
      const countryName = this.getCountryName(location.country);
      parts.push(countryName || location.country);
    }

    return parts.join(', ');
  }

  /**
   * Validate location data
   *
   * @param location - Location data to validate
   * @returns Validation result with errors
   */
  static validateLocation(location: LocationData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate country
    if (location.country) {
      const country = this.getCountry(location.country);
      if (!country) {
        errors.push(`Invalid country code: ${location.country}`);
      } else {
        // Validate region if provided
        if (location.state) {
          if (this.hasRegions(location.country)) {
            const region = this.getRegion(location.country, location.state);
            if (!region) {
              errors.push(`Invalid region code "${location.state}" for country ${country.name}`);
            } else {
              // Validate city if provided
              if (location.city && this.hasCities(location.country, location.state)) {
                const cities = this.getCities(location.country, location.state);
                const cityExists = cities.some(c => c.name.toLowerCase() === location.city?.toLowerCase());
                if (!cityExists) {
                  errors.push(`Invalid city "${location.city}" for region ${region.name}`);
                }
              }
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Search countries by name or code
   *
   * @param query - Search query
   * @returns Matching countries
   */
  static searchCountries(query: string): CountryOption[] {
    if (!query) return this.getAllCountries();

    const lowerQuery = query.toLowerCase();
    return this.getAllCountries().filter(country =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get popular/common countries for prioritized display
   *
   * @returns Array of popular country codes
   */
  static getPopularCountries(): string[] {
    return [
      'US', // United States
      'CA', // Canada
      'GB', // United Kingdom
      'AU', // Australia
      'DE', // Germany
      'FR', // France
      'IT', // Italy
      'ES', // Spain
      'MX', // Mexico
      'BR', // Brazil
    ];
  }

  /**
   * Get countries grouped by region (for organized dropdowns)
   */
  static getCountriesByRegion(): Record<string, CountryOption[]> {
    const regions = {
      'North America': [] as CountryOption[],
      'Europe': [] as CountryOption[],
      'Asia': [] as CountryOption[],
      'South America': [] as CountryOption[],
      'Africa': [] as CountryOption[],
      'Oceania': [] as CountryOption[],
      'Other': [] as CountryOption[]
    };

    const regionMapping: Record<string, string> = {
      // North America
      'US': 'North America', 'CA': 'North America', 'MX': 'North America',
      // Europe
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe',
      'ES': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'CH': 'Europe',
      'AT': 'Europe', 'PL': 'Europe', 'SE': 'Europe', 'NO': 'Europe',
      // Asia
      'CN': 'Asia', 'JP': 'Asia', 'IN': 'Asia', 'KR': 'Asia',
      'SG': 'Asia', 'TH': 'Asia', 'VN': 'Asia', 'MY': 'Asia',
      // South America
      'BR': 'South America', 'AR': 'South America', 'CL': 'South America',
      'CO': 'South America', 'PE': 'South America',
      // Africa
      'ZA': 'Africa', 'EG': 'Africa', 'NG': 'Africa', 'KE': 'Africa',
      // Oceania
      'AU': 'Oceania', 'NZ': 'Oceania'
    };

    this.getAllCountries().forEach(country => {
      const region = regionMapping[country.code] || 'Other';
      regions[region as keyof typeof regions].push(country);
    });

    return regions;
  }
}

// Export convenience functions
export const {
  getAllCountries,
  getCountry,
  getCountryName,
  getRegions,
  getRegion,
  getRegionName,
  hasRegions: countryHasRegions,
  getCities,
  hasCities: regionHasCities,
  formatLocationForDisplay,
  formatLocationCompact,
  formatFullAddress,
  validateLocation,
  searchCountries,
  getPopularCountries,
  getCountriesByRegion
} = LocationService;
