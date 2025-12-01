import { z } from 'zod';

// ============================================================================
// User Profile Schemas
// ============================================================================

export const userProfileUpdateSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be less than 100 characters'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (E.164 format)')
    .optional()
    .nullable(),
  title: z.string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .nullable(),
  department: z.string()
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .nullable(),
  timezone: z.string()
    .min(1, 'Timezone is required'),
  language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'], {
    errorMap: () => ({ message: 'Please select a valid language' })
  }),
  avatar: z.string()
    .url('Avatar must be a valid URL')
    .optional()
    .nullable()
});

export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;

// ============================================================================
// Company Settings Schemas
// ============================================================================

export const companySettingsUpdateSchema = z.object({
  // Basic Information
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters'),
  legalName: z.string()
    .max(200, 'Legal name must be less than 200 characters')
    .optional()
    .nullable(),
  dba: z.string()
    .max(200, 'DBA must be less than 200 characters')
    .optional()
    .nullable(),
  logo: z.string()
    .url('Logo must be a valid URL')
    .optional()
    .nullable(),
  website: z.string()
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  industry: z.string()
    .max(100, 'Industry must be less than 100 characters')
    .optional()
    .nullable(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'], {
    errorMap: () => ({ message: 'Please select a valid company size' })
  }).optional().nullable(),
  taxId: z.string()
    .regex(/^\d{2}-\d{7}$/, 'Tax ID must be in format XX-XXXXXXX')
    .optional()
    .nullable(),
  businessType: z.enum(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship', 'Other'], {
    errorMap: () => ({ message: 'Please select a valid business type' })
  }).optional().nullable(),

  // Address Information
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .nullable(),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .nullable(),
  state: z.string()
    .length(2, 'State must be 2 characters (e.g., NY, CA)')
    .optional()
    .nullable(),
  postalCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Postal code must be in format XXXXX or XXXXX-XXXX')
    .optional()
    .nullable(),
  country: z.string()
    .length(2, 'Country must be 2 characters (ISO code)')
    .default('US'),

  // Contact Information
  contactEmail: z.string()
    .email('Please enter a valid email address')
    .optional()
    .nullable(),
  contactPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .nullable(),
  supportEmail: z.string()
    .email('Please enter a valid email address')
    .optional()
    .nullable(),
  supportPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .nullable(),

  // Business Settings
  timezone: z.string()
    .min(1, 'Timezone is required')
    .default('America/New_York'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'], {
    errorMap: () => ({ message: 'Please select a valid currency' })
  }).default('USD'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], {
    errorMap: () => ({ message: 'Please select a valid date format' })
  }).default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h'], {
    errorMap: () => ({ message: 'Please select a valid time format' })
  }).default('12h')
});

export type CompanySettingsUpdate = z.infer<typeof companySettingsUpdateSchema>;

// ============================================================================
// User Preferences Schemas
// ============================================================================

export const userPreferencesUpdateSchema = z.object({
  // Display Preferences
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], {
    errorMap: () => ({ message: 'Please select a valid date format' })
  }).default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h'], {
    errorMap: () => ({ message: 'Please select a valid time format' })
  }).default('12h'),
  numberFormat: z.enum(['1,234.56', '1.234,56'], {
    errorMap: () => ({ message: 'Please select a valid number format' })
  }).default('1,234.56'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'], {
    errorMap: () => ({ message: 'Please select a valid currency' })
  }).default('USD'),

  // Notification Preferences
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  desktopNotifications: z.boolean().default(true),
  notifyOnDealUpdate: z.boolean().default(true),
  notifyOnPayment: z.boolean().default(true),
  notifyOnInvoice: z.boolean().default(true)
});

export type UserPreferencesUpdate = z.infer<typeof userPreferencesUpdateSchema>;

// ============================================================================
// Security Schemas
// ============================================================================

export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type PasswordChange = z.infer<typeof passwordChangeSchema>;

// ============================================================================
// File Upload Schemas
// ============================================================================

export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type),
      'File must be a valid image (JPEG, PNG, GIF, WebP, or SVG)'
    )
});

export const avatarUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'Avatar must be a valid image (JPEG, PNG, GIF, or WebP)'
    )
});

export type ImageUpload = z.infer<typeof imageUploadSchema>;
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

// ============================================================================
// Combined Update Schema (for API route)
// ============================================================================

export const combinedProfileUpdateSchema = z.object({
  profile: userProfileUpdateSchema.partial().optional(),
  preferences: userPreferencesUpdateSchema.partial().optional()
}).refine(
  (data) => data.profile !== undefined || data.preferences !== undefined,
  { message: 'At least one of profile or preferences must be provided' }
);

export type CombinedProfileUpdate = z.infer<typeof combinedProfileUpdateSchema>;
