/**
 * Postal code validation utilities
 * Country-specific postal code format validation
 *
 * Modern CRM Standard:
 * - Validate postal codes against country-specific formats
 * - Format postal codes consistently
 * - Support for 50+ countries
 */

interface PostalCodeFormat {
  regex: RegExp;
  format: string;         // Human-readable format description
  example: string;        // Example postal code
  formatFunc?: (code: string) => string;  // Optional formatting function
}

/**
 * Country-specific postal code formats
 * Key: ISO 3166-1 alpha-2 country code
 */
const POSTAL_CODE_FORMATS: Record<string, PostalCodeFormat> = {
  // North America
  'US': {
    regex: /^\d{5}(-\d{4})?$/,
    format: '##### or #####-####',
    example: '94102 or 94102-1234',
    formatFunc: (code: string) => {
      const digits = code.replace(/\D/g, '');
      if (digits.length === 5) return digits;
      if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
      return code;
    }
  },

  'CA': {
    regex: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    format: 'A#A #A#',
    example: 'K1A 0B1',
    formatFunc: (code: string) => {
      const cleaned = code.replace(/\s/g, '').toUpperCase();
      if (cleaned.length === 6) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      }
      return cleaned;
    }
  },

  'MX': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '01000'
  },

  // Europe
  'GB': {
    regex: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
    format: 'AA# #AA or A## #AA',
    example: 'SW1A 1AA',
    formatFunc: (code: string) => {
      const cleaned = code.replace(/\s/g, '').toUpperCase();
      // UK postcodes have outward code (2-4 chars) + inward code (3 chars)
      if (cleaned.length >= 5) {
        const inward = cleaned.slice(-3);
        const outward = cleaned.slice(0, -3);
        return `${outward} ${inward}`;
      }
      return cleaned;
    }
  },

  'DE': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '10115'
  },

  'FR': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '75001'
  },

  'ES': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '28001'
  },

  'IT': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '00118'
  },

  'NL': {
    regex: /^\d{4}\s?[A-Z]{2}$/i,
    format: '#### AA',
    example: '1012 AB',
    formatFunc: (code: string) => {
      const cleaned = code.replace(/\s/g, '').toUpperCase();
      if (cleaned.length === 6) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      }
      return cleaned;
    }
  },

  'BE': {
    regex: /^\d{4}$/,
    format: '####',
    example: '1000'
  },

  'CH': {
    regex: /^\d{4}$/,
    format: '####',
    example: '8001'
  },

  'AT': {
    regex: /^\d{4}$/,
    format: '####',
    example: '1010'
  },

  'PL': {
    regex: /^\d{2}-\d{3}$/,
    format: '##-###',
    example: '00-950',
    formatFunc: (code: string) => {
      const digits = code.replace(/\D/g, '');
      if (digits.length === 5) {
        return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      }
      return code;
    }
  },

  'PT': {
    regex: /^\d{4}-\d{3}$/,
    format: '####-###',
    example: '1000-001',
    formatFunc: (code: string) => {
      const digits = code.replace(/\D/g, '');
      if (digits.length === 7) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
      }
      return code;
    }
  },

  'CZ': {
    regex: /^\d{3}\s?\d{2}$/,
    format: '### ##',
    example: '110 00'
  },

  'DK': {
    regex: /^\d{4}$/,
    format: '####',
    example: '1050'
  },

  'SE': {
    regex: /^\d{3}\s?\d{2}$/,
    format: '### ##',
    example: '100 05'
  },

  'NO': {
    regex: /^\d{4}$/,
    format: '####',
    example: '0001'
  },

  'FI': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '00100'
  },

  // Asia-Pacific
  'AU': {
    regex: /^\d{4}$/,
    format: '####',
    example: '2000'
  },

  'NZ': {
    regex: /^\d{4}$/,
    format: '####',
    example: '1010'
  },

  'JP': {
    regex: /^\d{3}-?\d{4}$/,
    format: '###-####',
    example: '100-0001',
    formatFunc: (code: string) => {
      const digits = code.replace(/\D/g, '');
      if (digits.length === 7) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      }
      return code;
    }
  },

  'CN': {
    regex: /^\d{6}$/,
    format: '######',
    example: '100000'
  },

  'IN': {
    regex: /^\d{6}$/,
    format: '######',
    example: '110001'
  },

  'SG': {
    regex: /^\d{6}$/,
    format: '######',
    example: '018956'
  },

  'HK': {
    regex: /^$/,  // Hong Kong doesn't use postal codes
    format: 'N/A',
    example: 'N/A'
  },

  'KR': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '03187'
  },

  'TH': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '10110'
  },

  'MY': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '50000'
  },

  'ID': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '10110'
  },

  // Middle East
  'AE': {
    regex: /^$/,  // UAE doesn't use postal codes consistently
    format: 'N/A',
    example: 'N/A'
  },

  'SA': {
    regex: /^\d{5}(-\d{4})?$/,
    format: '##### or #####-####',
    example: '11564'
  },

  'IL': {
    regex: /^\d{7}$/,
    format: '#######',
    example: '9695016'
  },

  'TR': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '34410'
  },

  // South America
  'BR': {
    regex: /^\d{5}-?\d{3}$/,
    format: '#####-###',
    example: '01310-100',
    formatFunc: (code: string) => {
      const digits = code.replace(/\D/g, '');
      if (digits.length === 8) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
      }
      return code;
    }
  },

  'AR': {
    regex: /^[A-Z]\d{4}[A-Z]{3}$/i,
    format: 'A####AAA',
    example: 'C1002AAA'
  },

  'CL': {
    regex: /^\d{7}$/,
    format: '#######',
    example: '8320000'
  },

  // Africa
  'ZA': {
    regex: /^\d{4}$/,
    format: '####',
    example: '0001'
  },

  'EG': {
    regex: /^\d{5}$/,
    format: '#####',
    example: '11511'
  },
};

/**
 * Validate postal code against country-specific format
 *
 * @param code - Postal code to validate
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns true if postal code is valid for the country
 */
export const validatePostalCode = (code: string, countryCode: string): boolean => {
  if (!code || !countryCode) return true; // Optional field

  const upperCountry = countryCode.toUpperCase();
  const format = POSTAL_CODE_FORMATS[upperCountry];

  // If country not in list, accept any format
  if (!format) return true;

  // Countries without postal codes
  if (format.regex.source === '^$') return !code || code.trim() === '';

  return format.regex.test(code.trim());
};

/**
 * Format postal code according to country standards
 *
 * @param code - Postal code to format
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Formatted postal code
 */
export const formatPostalCode = (code: string, countryCode: string): string => {
  if (!code || !countryCode) return code;

  const upperCountry = countryCode.toUpperCase();
  const format = POSTAL_CODE_FORMATS[upperCountry];

  // If country not in list or no formatting function, return trimmed
  if (!format || !format.formatFunc) {
    return code.trim();
  }

  return format.formatFunc(code);
};

/**
 * Get postal code format information for a country
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Format information object or null
 */
export const getPostalCodeFormat = (countryCode: string): PostalCodeFormat | null => {
  if (!countryCode) return null;

  const upperCountry = countryCode.toUpperCase();
  return POSTAL_CODE_FORMATS[upperCountry] || null;
};

/**
 * Check if a country uses postal codes
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns true if country uses postal codes
 */
export const usesPostalCodes = (countryCode: string): boolean => {
  if (!countryCode) return true;

  const upperCountry = countryCode.toUpperCase();
  const format = POSTAL_CODE_FORMATS[upperCountry];

  // If not in list, assume yes
  if (!format) return true;

  // Check if regex is for "no postal code"
  return format.regex.source !== '^$';
};

/**
 * Normalize postal code (trim and basic cleanup)
 *
 * @param code - Postal code
 * @returns Normalized postal code
 */
export const normalizePostalCode = (code: string): string => {
  if (!code) return code;
  return code.trim().toUpperCase();
};
