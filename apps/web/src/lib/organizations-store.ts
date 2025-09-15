// Shared in-memory storage for organizations
let organizationsData: any[] = [];
let isStoreInitialized = false;

function initializeStore() {
  if (!isStoreInitialized) {
    organizationsData = [
      // Premium Dealers
      {
        id: 'org_1',
        name: 'AutoMax Luxury Dealership',
        companyId: 'AUTOMAX001',
        type: 'DEALER',
        description: 'Premier luxury vehicle dealership specializing in European imports',
        website: 'https://automaxluxury.com',
        address: '123 Luxury Auto Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        phone: '+1-555-LUXURY',
        email: 'info@automaxluxury.com',
        contactMethods: [
          { id: 'cm1', type: 'EMAIL_WORK', value: 'info@automaxluxury.com', primary: true },
          { id: 'cm2', type: 'PHONE_WORK', value: '+1-555-LUXURY', primary: true },
          { id: 'cm3', type: 'PHONE_MOBILE', value: '+1-555-0199', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm1', platform: 'INSTAGRAM', url: 'https://instagram.com/automaxluxury' },
          { id: 'sm2', platform: 'FACEBOOK', url: 'https://facebook.com/automaxluxury' }
        ],
        customFields: {
          annual_revenue: 15000000,
          specialty: 'Luxury European Vehicles',
          dealer_license: 'CA-DL-2024-001'
        },
        verified: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'org_2',
        name: 'Premier Motors East Coast',
        companyId: 'PREMIER001',
        type: 'DEALER',
        description: 'High-volume dealership serving the East Coast market',
        website: 'https://premiermotorsec.com',
        address: '456 Auto Plaza Drive',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '+1-212-555-0100',
        email: 'contact@premiermotorsec.com',
        contactMethods: [
          { id: 'cm4', type: 'EMAIL_WORK', value: 'contact@premiermotorsec.com', primary: true },
          { id: 'cm5', type: 'PHONE_WORK', value: '+1-212-555-0100', primary: true }
        ],
        customFields: {
          annual_revenue: 8500000,
          specialty: 'Domestic and Import Vehicles'
        },
        verified: true,
        createdAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 'org_3',
        name: 'City Cars Direct',
        type: 'DEALER',
        description: 'Small volume dealer focusing on pre-owned vehicles',
        website: 'https://citycarsdirect.com',
        address: '789 Commerce Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
        phone: '+1-312-555-0150',
        email: 'info@citycarsdirect.com',
        contactMethods: [
          { id: 'cm6', type: 'EMAIL_WORK', value: 'info@citycarsdirect.com', primary: true },
          { id: 'cm7', type: 'PHONE_WORK', value: '+1-312-555-0150', primary: true }
        ],
        customFields: {
          annual_revenue: 1200000,
          specialty: 'Pre-owned Vehicles'
        },
        verified: false,
        createdAt: '2024-02-01T09:00:00Z'
      },
      // Auction Houses
      {
        id: 'org_4',
        name: 'Copart Sacramento',
        type: 'AUCTION_HOUSE',
        description: 'Leading salvage vehicle auction facility',
        website: 'https://copart.com',
        address: '5200 Stockton Blvd',
        city: 'Sacramento',
        state: 'CA',
        zipCode: '95820',
        country: 'USA',
        phone: '+1-916-388-7859',
        email: 'sacramento@copart.com',
        contactMethods: [
          { id: 'cm8', type: 'EMAIL_WORK', value: 'sacramento@copart.com', primary: true },
          { id: 'cm9', type: 'PHONE_WORK', value: '+1-916-388-7859', primary: true }
        ],
        customFields: {
          auction_type: 'Salvage',
          weekly_sales: true,
          online_bidding: true
        },
        verified: true,
        createdAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 'org_5',
        name: 'Manheim Pennsylvania',
        type: 'AUCTION_HOUSE',
        description: 'Wholesale vehicle auction serving dealers nationwide',
        website: 'https://manheim.com',
        address: '1190 Lancaster Rd',
        city: 'Manheim',
        state: 'PA',
        zipCode: '17545',
        country: 'USA',
        phone: '+1-717-665-3571',
        email: 'pennsylvania@manheim.com',
        contactMethods: [
          { id: 'cm10', type: 'EMAIL_WORK', value: 'pennsylvania@manheim.com', primary: true },
          { id: 'cm11', type: 'PHONE_WORK', value: '+1-717-665-3571', primary: true }
        ],
        customFields: {
          auction_type: 'Wholesale',
          dealer_only: true,
          simulcast: true
        },
        verified: true,
        createdAt: '2024-01-05T12:00:00Z'
      },
      // Transportation/Shipping Companies
      {
        id: 'org_6',
        name: 'Express Auto Transport',
        type: 'SHIPPER',
        description: 'Nationwide vehicle transportation and logistics',
        website: 'https://expressautotransport.com',
        address: '987 Logistics Way',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'USA',
        phone: '+1-214-555-SHIP',
        email: 'dispatch@expressautotransport.com',
        contactMethods: [
          { id: 'cm12', type: 'EMAIL_WORK', value: 'dispatch@expressautotransport.com', primary: true },
          { id: 'cm13', type: 'PHONE_WORK', value: '+1-214-555-SHIP', primary: true },
          { id: 'cm14', type: 'EMAIL_OTHER', value: 'billing@expressautotransport.com', primary: false }
        ],
        customFields: {
          fleet_size: 125,
          service_area: 'Nationwide',
          insurance_rating: 'A+'
        },
        verified: true,
        createdAt: '2024-01-25T16:00:00Z'
      },
      {
        id: 'org_7',
        name: 'Pacific Shipping Solutions',
        type: 'SHIPPER',
        description: 'International vehicle shipping to Pacific markets',
        website: 'https://pacificshipping.com',
        address: '1500 Harbor Blvd',
        city: 'Long Beach',
        state: 'CA',
        zipCode: '90802',
        country: 'USA',
        phone: '+1-562-555-0300',
        email: 'operations@pacificshipping.com',
        contactMethods: [
          { id: 'cm15', type: 'EMAIL_WORK', value: 'operations@pacificshipping.com', primary: true },
          { id: 'cm16', type: 'PHONE_WORK', value: '+1-562-555-0300', primary: true }
        ],
        customFields: {
          ports_served: ['Long Beach', 'Los Angeles', 'Oakland'],
          international_routes: true,
          container_services: true
        },
        verified: true,
        createdAt: '2024-02-10T11:30:00Z'
      },
      // Processing Centers
      {
        id: 'org_8',
        name: 'United Cars Processing Center',
        type: 'PROCESSING_CENTER',
        description: 'Central processing facility for title and documentation',
        website: 'https://unitedcars.com',
        address: '2500 Industrial Pkwy',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85043',
        country: 'USA',
        phone: '+1-602-555-0400',
        email: 'processing@unitedcars.com',
        contactMethods: [
          { id: 'cm17', type: 'EMAIL_WORK', value: 'processing@unitedcars.com', primary: true },
          { id: 'cm18', type: 'PHONE_WORK', value: '+1-602-555-0400', primary: true },
          { id: 'cm19', type: 'EMAIL_OTHER', value: 'support@unitedcars.com', primary: false }
        ],
        customFields: {
          processing_capacity: '500 titles/day',
          operating_hours: '24/7',
          services: ['Title Processing', 'Documentation', 'Quality Control']
        },
        verified: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      // Retail Clients
      {
        id: 'org_9',
        name: 'Johnson Family Auto',
        type: 'RETAIL_CLIENT',
        description: 'Family-owned independent lot',
        address: '456 Main Street',
        city: 'Springfield',
        state: 'MO',
        zipCode: '65801',
        country: 'USA',
        phone: '+1-417-555-0250',
        email: 'johnson@familyauto.com',
        contactMethods: [
          { id: 'cm20', type: 'EMAIL_PERSONAL', value: 'johnson@familyauto.com', primary: true },
          { id: 'cm21', type: 'PHONE_MOBILE', value: '+1-417-555-0250', primary: true }
        ],
        customFields: {
          lot_size: 25,
          years_in_business: 15,
          specializes_in: 'Used Family Vehicles'
        },
        verified: false,
        createdAt: '2024-02-15T13:00:00Z'
      },
      {
        id: 'org_10',
        name: 'Elite Collectors LLC',
        type: 'RETAIL_CLIENT',
        description: 'High-end collector and restoration specialist',
        website: 'https://elitecollectors.com',
        address: '789 Heritage Lane',
        city: 'Scottsdale',
        state: 'AZ',
        zipCode: '85251',
        country: 'USA',
        phone: '+1-480-555-0350',
        email: 'acquisitions@elitecollectors.com',
        contactMethods: [
          { id: 'cm22', type: 'EMAIL_WORK', value: 'acquisitions@elitecollectors.com', primary: true },
          { id: 'cm23', type: 'PHONE_WORK', value: '+1-480-555-0350', primary: true }
        ],
        socialMediaLinks: [
          { id: 'sm3', platform: 'INSTAGRAM', url: 'https://instagram.com/elitecollectors' }
        ],
        customFields: {
          collection_focus: 'Classic American Muscle Cars',
          restoration_services: true,
          auction_participation: true
        },
        verified: true,
        createdAt: '2024-01-30T10:15:00Z'
      }
    ];
    isStoreInitialized = true;
  }
}

// Store operations
export const organizationsStore = {
  getAll() {
    initializeStore();
    return [...organizationsData];
  },

  getById(id: string) {
    initializeStore();
    return organizationsData.find(org => org.id === id);
  },

  create(orgData: any) {
    initializeStore();
    const newOrg = {
      ...orgData,
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    organizationsData.push(newOrg);
    return newOrg;
  },

  update(id: string, updateData: any) {
    initializeStore();
    const index = organizationsData.findIndex(org => org.id === id);
    if (index === -1) {
      return null;
    }
    
    organizationsData[index] = {
      ...organizationsData[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    return organizationsData[index];
  },

  delete(id: string) {
    initializeStore();
    const index = organizationsData.findIndex(org => org.id === id);
    if (index === -1) {
      return false;
    }
    
    organizationsData.splice(index, 1);
    return true;
  }
};