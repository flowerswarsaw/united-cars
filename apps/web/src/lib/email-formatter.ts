/**
 * Email normalization utilities
 * RFC 5321 compliant email standardization for storage
 *
 * Modern CRM Standard:
 * - Store emails in lowercase
 * - Trim whitespace
 * - Validate format
 * - Consistent storage enables proper duplicate detection
 */

/**
 * Normalize email address for storage
 *
 * Applies RFC 5321 normalization:
 * - Convert to lowercase (email local-part is case-sensitive per RFC but CRMs treat as case-insensitive)
 * - Trim leading/trailing whitespace
 * - Remove multiple spaces
 *
 * @param email - Email address in any format
 * @returns Normalized email address
 *
 * Examples:
 * - "John.Doe@Example.COM" → "john.doe@example.com"
 * - "  user@DOMAIN.com  " → "user@domain.com"
 * - "Test+Tag@Gmail.COM" → "test+tag@gmail.com"
 */
export const formatEmailForStorage = (email: string): string => {
  if (!email) return email;

  // Trim whitespace and convert to lowercase
  return email.trim().toLowerCase();
};

/**
 * Validate email format (basic validation)
 *
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;

  // Basic RFC 5321 email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format an array of contact methods, normalizing email addresses
 *
 * @param contactMethods - Array of contact method objects
 * @returns Array with normalized emails
 */
export const formatContactMethodsEmails = (
  contactMethods: Array<{ type: string; value: string; [key: string]: any }>
): Array<{ type: string; value: string; [key: string]: any }> => {
  return contactMethods.map(method => {
    if (method.type.toString().includes('EMAIL') && method.value) {
      return {
        ...method,
        value: formatEmailForStorage(method.value)
      };
    }
    return method;
  });
};

/**
 * Normalize email for comparison (used in search and duplicate detection)
 * Same as formatEmailForStorage but explicit function name for clarity
 *
 * @param email - Email address
 * @returns Normalized email for comparison
 */
export const normalizeEmailForComparison = (email: string): string => {
  return formatEmailForStorage(email);
};

/**
 * Extract domain from email address
 *
 * @param email - Email address
 * @returns Domain part of email (e.g., "example.com")
 */
export const extractEmailDomain = (email: string): string => {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase();
};

/**
 * Check if email is from a free email provider
 * Useful for business vs personal email detection
 *
 * @param email - Email address
 * @returns true if email is from a free provider
 */
export const isFreeEmailProvider = (email: string): boolean => {
  const domain = extractEmailDomain(email);
  const freeProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
    'yandex.com'
  ];
  return freeProviders.includes(domain);
};
