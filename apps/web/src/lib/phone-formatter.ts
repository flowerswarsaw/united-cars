/**
 * Phone number formatting utilities using E.164 international standard
 * Robust implementation for international phone numbers using libphonenumber-js
 *
 * E.164 format: +[country code][subscriber number] (e.g., +14155552671, +442071838750)
 * - Maximum 15 digits including country code
 * - No spaces, dashes, or formatting characters
 * - Universally recognized standard used by modern CRMs
 */

import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

/**
 * Normalize phone to digits only (strips all non-digit characters except leading +)
 */
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, ''); // Keep only first +
};

/**
 * Format phone number to E.164 international standard for storage
 *
 * @param phone - Phone number in any format
 * @param defaultCountry - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'DE')
 * @returns Phone number in E.164 format (+[country][number]) or original if parsing fails
 *
 * Examples:
 * - "(555) 123-4567" → "+15551234567" (with defaultCountry: 'US')
 * - "+44 20 7183 8750" → "+442071838750"
 * - "+49 151 23456789" → "+4915123456789"
 * - "+91 98765 43210" → "+919876543210"
 */
export const formatPhoneForStorage = (
  phone: string,
  defaultCountry: string = 'US'
): string => {
  if (!phone) return phone;

  // Normalize input
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;

  try {
    // If phone starts with +, try parsing as international
    if (normalized.startsWith('+')) {
      // Validate and parse
      if (isValidPhoneNumber(normalized)) {
        const phoneNumber = parsePhoneNumber(normalized);
        // Return in E.164 format
        return phoneNumber.format('E.164');
      }

      // Try parsing without validation (more lenient)
      try {
        const phoneNumber = parsePhoneNumber(normalized);
        return phoneNumber.format('E.164');
      } catch {
        // If still fails, return normalized with +
        return normalized.startsWith('+') ? normalized : `+${normalized}`;
      }
    }

    // No country code provided, try with default country
    const phoneWithCountry = parsePhoneNumber(normalized, defaultCountry);
    if (phoneWithCountry && phoneWithCountry.isValid()) {
      return phoneWithCountry.format('E.164');
    }

    // Try as international if default country didn't work
    const phoneInternational = parsePhoneNumber(`+${normalized}`);
    if (phoneInternational && phoneInternational.isValid()) {
      return phoneInternational.format('E.164');
    }

    // Last resort: try common country codes
    const commonCountries = ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'CA', 'AU'];
    for (const country of commonCountries) {
      try {
        const phoneAttempt = parsePhoneNumber(normalized, country);
        if (phoneAttempt && phoneAttempt.isValid()) {
          return phoneAttempt.format('E.164');
        }
      } catch {
        continue;
      }
    }

    // If all parsing fails, return with + prefix
    return normalized.startsWith('+') ? normalized : `+${normalized}`;
  } catch (error) {
    console.warn('Phone formatting failed:', error);
    // Return normalized phone with + prefix as fallback
    return normalized.startsWith('+') ? normalized : `+${normalized}`;
  }
};

/**
 * Format an array of contact methods, normalizing phone numbers to E.164
 *
 * @param contactMethods - Array of contact method objects
 * @param defaultCountry - Default country code for phone parsing
 * @returns Array with formatted phone numbers
 */
export const formatContactMethods = (
  contactMethods: Array<{ type: string; value: string; [key: string]: any }>,
  defaultCountry: string = 'US'
): Array<{ type: string; value: string; [key: string]: any }> => {
  return contactMethods.map(method => {
    if (method.type.toString().includes('PHONE') && method.value) {
      return {
        ...method,
        value: formatPhoneForStorage(method.value, defaultCountry)
      };
    }
    return method;
  });
};

/**
 * Format phone number for display (with country-specific formatting)
 *
 * @param phone - Phone number (preferably in E.164 format)
 * @returns Formatted phone for display (e.g., "+1 (415) 555-2671")
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return phone;

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber) {
      // Return in international format for display
      return phoneNumber.formatInternational();
    }
    return phone;
  } catch {
    return phone;
  }
};

/**
 * AsYouType formatter for real-time input formatting
 * Useful for form inputs to show formatting as user types
 *
 * @param value - Current input value
 * @param country - ISO country code
 * @returns Formatted value with country-specific formatting
 */
export const formatPhoneAsYouType = (
  value: string,
  country: string = 'US'
): string => {
  const formatter = new AsYouType(country as any);
  return formatter.input(value);
};
