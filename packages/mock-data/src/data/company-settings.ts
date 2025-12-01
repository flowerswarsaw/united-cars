import { CompanySettings } from '../types';

// Company settings for existing organizations
export const companySettings: CompanySettings[] = [
  {
    id: 'company-settings-001',
    orgId: 'united-cars',
    companyName: 'United Cars',
    legalName: 'United Cars International, LLC',
    dba: null,
    logo: null,
    website: 'https://unitedcars.com',
    industry: 'Automotive Import/Export',
    companySize: '11-50',
    taxId: '12-3456789',
    businessType: 'LLC',
    // Address
    address: '1234 Commerce Drive',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    // Contact information
    contactEmail: 'contact@unitedcars.com',
    contactPhone: '+1 (555) 100-2000',
    supportEmail: 'support@unitedcars.com',
    supportPhone: '+1 (555) 100-2001',
    // Business settings
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'company-settings-dealer-001',
    orgId: 'org-dealer-1',
    companyName: 'Demo Dealer Co.',
    legalName: 'Demo Dealer Corporation',
    dba: 'Demo Dealer',
    logo: null,
    website: 'https://demo-dealer.com',
    industry: 'Automotive Dealership',
    companySize: '1-10',
    taxId: '98-7654321',
    businessType: 'Corporation',
    // Address
    address: '5678 Dealer Avenue',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'US',
    // Contact information
    contactEmail: 'info@demo-dealer.com',
    contactPhone: '+1 (555) 200-3000',
    supportEmail: 'help@demo-dealer.com',
    supportPhone: '+1 (555) 200-3001',
    // Business settings
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  }
];
