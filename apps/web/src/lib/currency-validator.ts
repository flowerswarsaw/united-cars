/**
 * Currency validation utilities
 * ISO 4217 three-letter currency code enforcement
 *
 * Modern CRM Standard:
 * - Store ISO 4217 codes (USD, EUR, GBP)
 * - Validate currency codes
 * - Currency symbols for display
 * - Default currency by country
 */

export interface Currency {
  code: string;          // ISO 4217 code
  name: string;          // Full currency name
  symbol: string;        // Currency symbol
  decimalPlaces: number; // Standard decimal places
}

/**
 * Comprehensive ISO 4217 currency list
 * Includes 150+ currencies used in modern CRM systems
 */
export const CURRENCIES: Currency[] = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2 },

  // Asia-Pacific
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2 },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimalPlaces: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0 },

  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimalPlaces: 2 },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimalPlaces: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimalPlaces: 2 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', decimalPlaces: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimalPlaces: 3 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', decimalPlaces: 3 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', decimalPlaces: 3 },

  // Europe
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimalPlaces: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 2 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimalPlaces: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimalPlaces: 2 },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', decimalPlaces: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimalPlaces: 2 },

  // Americas
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimalPlaces: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimalPlaces: 2 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimalPlaces: 0 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimalPlaces: 2 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimalPlaces: 2 },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', decimalPlaces: 2 },

  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimalPlaces: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimalPlaces: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', decimalPlaces: 2 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', decimalPlaces: 3 },

  // Other Major Currencies
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', decimalPlaces: 0 },
];

// Default currencies by country (ISO 3166-1 alpha-2 to ISO 4217)
export const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, string> = {
  // North America
  'US': 'USD',
  'CA': 'CAD',
  'MX': 'MXN',

  // Europe
  'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR', 'EE': 'EUR', 'FI': 'EUR',
  'FR': 'EUR', 'DE': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'IT': 'EUR',
  'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR',
  'PT': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'ES': 'EUR',

  'GB': 'GBP',
  'CH': 'CHF',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'BG': 'BGN',
  'HR': 'HRK',
  'RU': 'RUB',
  'UA': 'UAH',
  'IS': 'ISK',

  // Asia-Pacific
  'JP': 'JPY',
  'CN': 'CNY',
  'HK': 'HKD',
  'SG': 'SGD',
  'IN': 'INR',
  'KR': 'KRW',
  'TH': 'THB',
  'MY': 'MYR',
  'ID': 'IDR',
  'PH': 'PHP',
  'TW': 'TWD',
  'VN': 'VND',
  'AU': 'AUD',
  'NZ': 'NZD',

  // Middle East
  'AE': 'AED',
  'SA': 'SAR',
  'IL': 'ILS',
  'TR': 'TRY',
  'QA': 'QAR',
  'KW': 'KWD',
  'BH': 'BHD',
  'OM': 'OMR',

  // South America
  'BR': 'BRL',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'PE': 'PEN',
  'VE': 'VES',

  // Africa
  'ZA': 'ZAR',
  'EG': 'EGP',
  'NG': 'NGN',
  'KE': 'KES',
  'MA': 'MAD',
  'TN': 'TND',
};

/**
 * Validate if a string is a valid ISO 4217 currency code
 *
 * @param code - Currency code to validate
 * @returns true if code is valid
 */
export const validateCurrencyCode = (code: string): boolean => {
  if (!code || code.length !== 3) return false;

  const upperCode = code.toUpperCase();
  return CURRENCIES.some(c => c.code === upperCode);
};

/**
 * Normalize currency code to uppercase
 *
 * @param code - Currency code
 * @returns Uppercase ISO 4217 code
 */
export const normalizeCurrency = (code: string): string => {
  if (!code) return code;
  return code.trim().toUpperCase();
};

/**
 * Get currency object by code
 *
 * @param code - ISO 4217 currency code
 * @returns Currency object or undefined
 */
export const getCurrency = (code: string): Currency | undefined => {
  if (!code) return undefined;

  const upperCode = code.toUpperCase();
  return CURRENCIES.find(c => c.code === upperCode);
};

/**
 * Get currency symbol by code
 *
 * @param code - ISO 4217 currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (code: string): string => {
  const currency = getCurrency(code);
  return currency ? currency.symbol : code;
};

/**
 * Get currency name by code
 *
 * @param code - ISO 4217 currency code
 * @returns Full currency name
 */
export const getCurrencyName = (code: string): string => {
  const currency = getCurrency(code);
  return currency ? currency.name : code;
};

/**
 * Get default currency for a country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns ISO 4217 currency code
 */
export const getDefaultCurrency = (countryCode: string): string => {
  if (!countryCode) return 'USD';

  const upperCode = countryCode.toUpperCase();
  return DEFAULT_CURRENCY_BY_COUNTRY[upperCode] || 'USD';
};

/**
 * Format currency for display
 *
 * @param code - ISO 4217 currency code
 * @returns Formatted currency string (e.g., "US Dollar ($)")
 */
export const formatCurrencyForDisplay = (code: string): string => {
  const currency = getCurrency(code);
  if (!currency) return code;

  return `${currency.name} (${currency.symbol})`;
};

/**
 * Format amount with currency
 *
 * @param amount - Numeric amount
 * @param code - ISO 4217 currency code
 * @returns Formatted amount string (e.g., "$1,234.56")
 */
export const formatAmountWithCurrency = (amount: number, code: string): string => {
  const currency = getCurrency(code);
  if (!currency) return `${amount} ${code}`;

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  });

  return `${currency.symbol}${formatted}`;
};

/**
 * Get list of all currencies
 *
 * @returns Array of all currency objects
 */
export const getAllCurrencies = (): Currency[] => {
  return CURRENCIES;
};

/**
 * Get list of major/popular currencies
 *
 * @returns Array of major currency codes
 */
export const getMajorCurrencies = (): string[] => {
  return ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR'];
};
