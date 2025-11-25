/**
 * Location validation schemas
 * Zod schemas for validating location data
 *
 * Modern CRM Standard:
 * - Validate country, region, city, postal code
 * - Support optional fields
 * - Consistent validation across all entities
 * - Integration with country/region validators
 */

import { z } from 'zod';
import { validateCountryCode, validateRegionCode, normalizeCountryCode, normalizeRegionCode } from './country';
import { validatePostalCode, normalizePostalCode } from './postal-code';

/**
 * Country code schema (ISO 3166-1 alpha-2)
 */
export const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .toUpperCase()
  .refine(
    (code) => validateCountryCode(code),
    { message: 'Invalid country code' }
  )
  .transform(normalizeCountryCode);

/**
 * Region/state code schema
 */
export const regionCodeSchema = z
  .string()
  .min(1, 'Region code is required')
  .toUpperCase()
  .transform(normalizeRegionCode);

/**
 * City name schema
 */
export const citySchema = z
  .string()
  .min(1, 'City is required')
  .max(100, 'City name is too long')
  .trim();

/**
 * Street address schema
 */
export const addressSchema = z
  .string()
  .min(1, 'Address is required')
  .max(200, 'Address is too long')
  .trim();

/**
 * Postal/ZIP code schema
 */
export const postalCodeSchema = z
  .string()
  .min(1, 'Postal code is required')
  .max(20, 'Postal code is too long')
  .trim()
  .transform(normalizePostalCode);

/**
 * Complete location schema (all fields required)
 */
export const locationSchema = z.object({
  country: countryCodeSchema,
  state: regionCodeSchema,
  city: citySchema,
  address: addressSchema.optional(),
  zipCode: postalCodeSchema.optional()
});

/**
 * Partial location schema (all fields optional)
 */
export const partialLocationSchema = z.object({
  country: countryCodeSchema.optional(),
  state: regionCodeSchema.optional(),
  city: citySchema.optional(),
  address: addressSchema.optional(),
  zipCode: postalCodeSchema.optional()
});

/**
 * Minimal location schema (only country required)
 */
export const minimalLocationSchema = z.object({
  country: countryCodeSchema,
  state: regionCodeSchema.optional(),
  city: citySchema.optional(),
  address: addressSchema.optional(),
  zipCode: postalCodeSchema.optional()
});

/**
 * Address with location schema (for full addresses)
 */
export const fullAddressSchema = z.object({
  address: addressSchema,
  city: citySchema,
  state: regionCodeSchema,
  zipCode: postalCodeSchema,
  country: countryCodeSchema
});

/**
 * Optional full address schema
 */
export const optionalFullAddressSchema = z.object({
  address: addressSchema.optional(),
  city: citySchema.optional(),
  state: regionCodeSchema.optional(),
  zipCode: postalCodeSchema.optional(),
  country: countryCodeSchema.optional()
});

/**
 * Location validation with country-specific region validation
 */
export const validateLocation = (data: {
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate country
  if (data.country) {
    if (!validateCountryCode(data.country)) {
      errors.push(`Invalid country code: ${data.country}`);
    } else {
      // Validate region against country
      if (data.state) {
        if (!validateRegionCode(data.country, data.state)) {
          errors.push(`Invalid region "${data.state}" for country ${data.country}`);
        }
      }

      // Validate postal code format for country
      if (data.zipCode) {
        const postalValidation = validatePostalCode(data.zipCode, data.country);
        if (!postalValidation.isValid) {
          errors.push(postalValidation.error || 'Invalid postal code');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Type exports
 */
export type Location = z.infer<typeof locationSchema>;
export type PartialLocation = z.infer<typeof partialLocationSchema>;
export type MinimalLocation = z.infer<typeof minimalLocationSchema>;
export type FullAddress = z.infer<typeof fullAddressSchema>;
export type OptionalFullAddress = z.infer<typeof optionalFullAddressSchema>;
