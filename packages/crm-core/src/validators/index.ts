/**
 * CRM Core Validators
 * Centralized validation and normalization utilities
 */

// Email validation
export {
  formatEmailForStorage,
  formatContactMethodsEmails,
  isValidEmail,
  normalizeEmailForComparison,
  extractEmailDomain,
  isFreeEmailProvider
} from './email';

// Aliases for backward compatibility
export { isValidEmail as validateEmail } from './email';
export { formatEmailForStorage as normalizeEmail } from './email';

// Country validation
export {
  validateCountryCode,
  normalizeCountryCode,
  getCountryName,
  validateRegionCode,
  normalizeRegionCode,
  getAllCountries,
  getRegionsByCountry,
  hasRegions,
  formatCountryForDisplay
} from './country';

export type { Country } from './countries-regions';

// Currency validation
export {
  validateCurrencyCode,
  normalizeCurrency,
  getCurrency,
  getCurrencySymbol,
  getCurrencyName,
  getDefaultCurrency,
  formatCurrencyForDisplay,
  formatAmountWithCurrency,
  getAllCurrencies,
  getMajorCurrencies
} from './currency';

export type { Currency } from './currency';

// Postal code validation
export {
  validatePostalCode,
  formatPostalCode,
  getPostalCodeFormat,
  usesPostalCodes,
  normalizePostalCode
} from './postal-code';

// Date formatting
export {
  formatDateForStorage,
  parseStoredDate,
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatRelativeDate,
  isValidDate,
  getDateRange,
  addTime,
  formatDateForInput,
  formatDateTimeForInput
} from './date';

// Location validation
export {
  countryCodeSchema,
  regionCodeSchema,
  citySchema,
  addressSchema,
  postalCodeSchema,
  locationSchema,
  partialLocationSchema,
  minimalLocationSchema,
  fullAddressSchema,
  optionalFullAddressSchema,
  validateLocation
} from './location';

export type {
  Location,
  PartialLocation,
  MinimalLocation,
  FullAddress,
  OptionalFullAddress
} from './location';
