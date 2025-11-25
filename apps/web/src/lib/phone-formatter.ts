/**
 * Phone number formatting utilities
 * Standardizes phone numbers to a consistent format for storage
 */

/**
 * Normalize phone to digits only
 */
export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Remove all non-digits
};

/**
 * Format phone number to standard format
 * US numbers: +1-XXX-XXX-XXXX
 * International: +[country]-[number]
 */
export const formatPhoneForStorage = (phone: string): string => {
  if (!phone) return phone;

  // Get digits only
  const digits = normalizePhone(phone);

  // Empty after normalization
  if (!digits) return phone;

  // Check if it starts with a country code (1-3 digits followed by the rest)
  // US/Canada numbers: 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    // Format as +1-XXX-XXX-XXXX
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // US numbers without country code: 10 digits
  if (digits.length === 10) {
    // Format as +1-XXX-XXX-XXXX
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // International numbers with country code (starts with +)
  if (phone.startsWith('+')) {
    // Keep the + and format with dashes
    if (digits.length > 10) {
      // Assume first 1-3 digits are country code
      const countryCode = digits.slice(0, digits.length - 10);
      const number = digits.slice(digits.length - 10);
      return `+${countryCode}-${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
    }
    // Just prepend + to the digits
    return `+${digits}`;
  }

  // For other cases, assume US if 7+ digits
  if (digits.length >= 7 && digits.length <= 10) {
    // Pad to 10 digits if needed (local numbers)
    const paddedDigits = digits.padStart(10, '0');
    return `+1-${paddedDigits.slice(0, 3)}-${paddedDigits.slice(3, 6)}-${paddedDigits.slice(6)}`;
  }

  // Can't determine format, return with + prefix
  return `+${digits}`;
};

/**
 * Format an array of contact methods, normalizing phone numbers
 */
export const formatContactMethods = (
  contactMethods: Array<{ type: string; value: string; [key: string]: any }>
): Array<{ type: string; value: string; [key: string]: any }> => {
  return contactMethods.map(method => {
    if (method.type.toString().includes('PHONE') && method.value) {
      return {
        ...method,
        value: formatPhoneForStorage(method.value)
      };
    }
    return method;
  });
};
