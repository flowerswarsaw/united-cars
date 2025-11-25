/**
 * CRM Core Validators
 * Centralized validation and normalization utilities
 */

// Email validation
export {
  formatEmailForStorage,
  formatContactMethodsEmails,
  validateEmail,
  normalizeEmail
} from './email';

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
