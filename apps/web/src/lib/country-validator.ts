/**
 * Country and region validation utilities
 * ISO 3166-1 alpha-2 country code enforcement
 *
 * Modern CRM Standard:
 * - Store 2-letter ISO country codes (US, GB, DE)
 * - Validate region codes against country
 * - Convert full country names to ISO codes
 * - Consistent storage enables proper filtering and grouping
 */

import { COUNTRIES_REGIONS, type Country } from './countries-regions';

// Common country name variations to ISO code mapping
const COUNTRY_NAME_MAPPINGS: Record<string, string> = {
  // North America
  'usa': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'america': 'US',
  'canada': 'CA',
  'mexico': 'MX',

  // Europe
  'uk': 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'britain': 'GB',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'poland': 'PL',
  'portugal': 'PT',
  'greece': 'GR',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'ireland': 'IE',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'romania': 'RO',
  'hungary': 'HU',
  'bulgaria': 'BG',
  'croatia': 'HR',
  'slovakia': 'SK',
  'slovenia': 'SI',

  // Asia
  'china': 'CN',
  'india': 'IN',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'singapore': 'SG',
  'thailand': 'TH',
  'vietnam': 'VN',
  'malaysia': 'MY',
  'indonesia': 'ID',
  'philippines': 'PH',
  'taiwan': 'TW',
  'hong kong': 'HK',

  // Middle East
  'uae': 'AE',
  'united arab emirates': 'AE',
  'saudi arabia': 'SA',
  'israel': 'IL',
  'turkey': 'TR',
  'iran': 'IR',
  'iraq': 'IQ',
  'qatar': 'QA',
  'kuwait': 'KW',

  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',

  // South America
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',

  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'nigeria': 'NG',
  'kenya': 'KE',
  'morocco': 'MA',
};

/**
 * Validate if a string is a valid ISO 3166-1 alpha-2 country code
 *
 * @param code - Country code to validate
 * @returns true if code is valid
 */
export const validateCountryCode = (code: string): boolean => {
  if (!code || code.length !== 2) return false;

  const upperCode = code.toUpperCase();
  return COUNTRIES_REGIONS.countries.some(c => c.code === upperCode);
};

/**
 * Normalize country input to ISO 3166-1 alpha-2 code
 *
 * Handles:
 * - Already valid ISO codes (US, GB) → return as-is
 * - Full country names (United States, Germany) → convert to code
 * - Common variations (USA, UK) → convert to code
 * - Case-insensitive matching
 *
 * @param input - Country name or code
 * @returns ISO 3166-1 alpha-2 code or original input if no match found
 *
 * Examples:
 * - "US" → "US"
 * - "USA" → "US"
 * - "United States" → "US"
 * - "Germany" → "DE"
 * - "uk" → "GB"
 */
export const normalizeCountryCode = (input: string): string => {
  if (!input) return input;

  const trimmed = input.trim();

  // Check if already a valid ISO code
  if (trimmed.length === 2) {
    const upperCode = trimmed.toUpperCase();
    if (validateCountryCode(upperCode)) {
      return upperCode;
    }
  }

  // Try to match against common name variations
  const lowerInput = trimmed.toLowerCase();
  if (COUNTRY_NAME_MAPPINGS[lowerInput]) {
    return COUNTRY_NAME_MAPPINGS[lowerInput];
  }

  // Try to match against full country names in database
  const matchedCountry = COUNTRIES_REGIONS.countries.find(
    c => c.name.toLowerCase() === lowerInput
  );

  if (matchedCountry) {
    return matchedCountry.code;
  }

  // No match found, return original (will fail validation)
  return trimmed.length === 2 ? trimmed.toUpperCase() : trimmed;
};

/**
 * Get country name from ISO code
 *
 * @param code - ISO 3166-1 alpha-2 country code
 * @returns Full country name
 */
export const getCountryName = (code: string): string => {
  if (!code) return '';

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === code.toUpperCase());
  return country ? country.name : code;
};

/**
 * Validate if a region/state code is valid for a given country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param regionCode - Region/state code
 * @returns true if region is valid for the country
 */
export const validateRegionCode = (countryCode: string, regionCode: string): boolean => {
  if (!countryCode || !regionCode) return false;

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === countryCode.toUpperCase());

  // If country has no regions defined, any region is technically valid
  if (!country || !country.regions || country.regions.length === 0) {
    return true;
  }

  // Check if region code exists for this country
  return country.regions.some(r => r.code === regionCode.toUpperCase());
};

/**
 * Normalize region/state code to uppercase
 *
 * @param regionCode - Region/state code
 * @returns Uppercase region code
 */
export const normalizeRegionCode = (regionCode: string): string => {
  if (!regionCode) return regionCode;
  return regionCode.trim().toUpperCase();
};

/**
 * Get list of all countries with their codes
 *
 * @returns Array of country objects
 */
export const getAllCountries = (): Country[] => {
  return COUNTRIES_REGIONS.countries;
};

/**
 * Get regions for a specific country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of regions for the country
 */
export const getRegionsByCountry = (countryCode: string): Array<{code: string; name: string}> => {
  if (!countryCode) return [];

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === countryCode.toUpperCase());
  return country?.regions || [];
};

/**
 * Check if a country has regions defined
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns true if country has regions
 */
export const hasRegions = (countryCode: string): boolean => {
  if (!countryCode) return false;

  const country = COUNTRIES_REGIONS.countries.find(c => c.code === countryCode.toUpperCase());
  return country?.regions ? country.regions.length > 0 : false;
};

/**
 * Format country for display
 *
 * @param code - ISO 3166-1 alpha-2 country code
 * @returns Formatted country string (e.g., "United States (US)")
 */
export const formatCountryForDisplay = (code: string): string => {
  if (!code) return '';

  const name = getCountryName(code);
  return name === code ? code : `${name} (${code})`;
};
