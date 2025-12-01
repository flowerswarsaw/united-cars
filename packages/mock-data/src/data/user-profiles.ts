import { UserProfile, UserPreferences } from '../types';

// User profiles for existing users
export const userProfiles: UserProfile[] = [
  {
    id: 'profile-admin-001',
    userId: 'admin-user-001',
    displayName: 'System Administrator',
    email: 'admin@unitedcars.com',
    phone: '+1 (555) 123-4567',
    title: 'Chief Technology Officer',
    department: 'Technology & Operations',
    avatar: null,
    timezone: 'America/New_York',
    language: 'en',
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'profile-dealer-001',
    userId: 'user-dealer-1',
    displayName: 'Dealer User',
    email: 'dealer@demo.com',
    phone: '+1 (555) 987-6543',
    title: 'Dealer Representative',
    department: 'Sales',
    avatar: null,
    timezone: 'America/New_York',
    language: 'en',
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'profile-ops-001',
    userId: 'user-ops-1',
    displayName: 'Operations User',
    email: 'ops@demo.com',
    phone: '+1 (555) 234-5678',
    title: 'Operations Manager',
    department: 'Operations',
    avatar: null,
    timezone: 'America/Los_Angeles',
    language: 'en',
    lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  },
  {
    id: 'profile-claims-001',
    userId: 'user-claims-1',
    displayName: 'Claims Specialist',
    email: 'claims@demo.com',
    phone: '+1 (555) 345-6789',
    title: 'Claims Manager',
    department: 'Customer Service',
    avatar: null,
    timezone: 'America/Chicago',
    language: 'en',
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  }
];

// User preferences for existing users
export const userPreferences: UserPreferences[] = [
  {
    id: 'pref-admin-001',
    userId: 'admin-user-001',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: '1,234.56',
    currency: 'USD',
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    notifyOnDealUpdate: true,
    notifyOnPayment: true,
    notifyOnInvoice: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'pref-dealer-001',
    userId: 'user-dealer-1',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: '1,234.56',
    currency: 'USD',
    emailNotifications: true,
    smsNotifications: true,
    desktopNotifications: false,
    notifyOnDealUpdate: true,
    notifyOnPayment: true,
    notifyOnInvoice: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'pref-ops-001',
    userId: 'user-ops-1',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
    numberFormat: '1,234.56',
    currency: 'USD',
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    notifyOnDealUpdate: true,
    notifyOnPayment: false,
    notifyOnInvoice: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  },
  {
    id: 'pref-claims-001',
    userId: 'user-claims-1',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: '1,234.56',
    currency: 'USD',
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    notifyOnDealUpdate: false,
    notifyOnPayment: false,
    notifyOnInvoice: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  }
];
