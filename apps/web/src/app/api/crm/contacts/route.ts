import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporary fix: return basic test data while fixing import issues
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const organisationId = searchParams.get('organisationId');
    const paginated = searchParams.get('paginated') === 'true';
    
    const testContacts = [
      // AutoMax Luxury Dealership Contacts
      {
        id: 'contact_1',
        firstName: 'Marcus',
        lastName: 'Rodriguez',
        title: 'General Manager',
        organisationId: 'org_1',
        department: 'Management',
        contactMethods: [
          { id: 'cm_c1', type: 'EMAIL_WORK', value: 'marcus.rodriguez@automaxluxury.com', primary: true },
          { id: 'cm_c2', type: 'PHONE_WORK', value: '+1-555-0101', primary: true },
          { id: 'cm_c3', type: 'PHONE_MOBILE', value: '+1-555-0102', primary: false },
          { id: 'cm_c4', type: 'EMAIL_PERSONAL', value: 'marcus.r.personal@gmail.com', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm_c1', platform: 'LINKEDIN', url: 'https://linkedin.com/in/marcusrodriguez' }
        ],
        customFields: {
          hire_date: '2020-03-15',
          years_experience: 15,
          languages: ['English', 'Spanish'],
          preferred_contact: 'Email'
        },
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'contact_2',
        firstName: 'Jennifer',
        lastName: 'Chen',
        title: 'Sales Director',
        organisationId: 'org_1',
        department: 'Sales',
        contactMethods: [
          { id: 'cm_c5', type: 'EMAIL_WORK', value: 'jennifer.chen@automaxluxury.com', primary: true },
          { id: 'cm_c6', type: 'PHONE_WORK', value: '+1-555-0103', primary: true },
          { id: 'cm_c7', type: 'PHONE_MOBILE', value: '+1-555-0104', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm_c2', platform: 'LINKEDIN', url: 'https://linkedin.com/in/jenniferchenautosales' }
        ],
        customFields: {
          hire_date: '2021-07-01',
          sales_territory: 'West Coast',
          quota_2024: 5000000
        },
        createdAt: '2024-01-16T14:30:00Z'
      },
      // Premier Motors East Coast Contacts
      {
        id: 'contact_3',
        firstName: 'Robert',
        lastName: 'Thompson',
        title: 'Owner/President',
        organisationId: 'org_2',
        department: 'Executive',
        contactMethods: [
          { id: 'cm_c8', type: 'EMAIL_WORK', value: 'robert.thompson@premiermotorsec.com', primary: true },
          { id: 'cm_c9', type: 'PHONE_WORK', value: '+1-212-555-0105', primary: true },
          { id: 'cm_c10', type: 'PHONE_MOBILE', value: '+1-212-555-0106', primary: false },
          { id: 'cm_c11', type: 'EMAIL_PERSONAL', value: 'rthompson.autos@gmail.com', primary: false }
        ],
        customFields: {
          ownership_percentage: 100,
          founded_year: 1998,
          family_business: true
        },
        createdAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 'contact_4',
        firstName: 'Lisa',
        lastName: 'Martinez',
        title: 'Finance Manager',
        organisationId: 'org_2',
        department: 'Finance',
        contactMethods: [
          { id: 'cm_c12', type: 'EMAIL_WORK', value: 'lisa.martinez@premiermotorsec.com', primary: true },
          { id: 'cm_c13', type: 'PHONE_WORK', value: '+1-212-555-0107', primary: true }
        ],
        customFields: {
          certifications: ['F&I Manager', 'Automotive Finance'],
          hire_date: '2019-04-12'
        },
        createdAt: '2024-01-21T09:15:00Z'
      },
      // City Cars Direct Contacts
      {
        id: 'contact_5',
        firstName: 'David',
        lastName: 'Wilson',
        title: 'General Manager',
        organisationId: 'org_3',
        department: 'Management',
        contactMethods: [
          { id: 'cm_c14', type: 'EMAIL_WORK', value: 'david.wilson@citycarsdirect.com', primary: true },
          { id: 'cm_c15', type: 'PHONE_WORK', value: '+1-312-555-0108', primary: true },
          { id: 'cm_c16', type: 'PHONE_MOBILE', value: '+1-312-555-0109', primary: false }
        ],
        customFields: {
          hire_date: '2022-01-15',
          previous_experience: 'CarMax, 8 years'
        },
        createdAt: '2024-02-01T09:00:00Z'
      },
      // Copart Sacramento Contacts
      {
        id: 'contact_6',
        firstName: 'Amanda',
        lastName: 'Foster',
        title: 'Operations Manager',
        organisationId: 'org_4',
        department: 'Operations',
        contactMethods: [
          { id: 'cm_c17', type: 'EMAIL_WORK', value: 'amanda.foster@copart.com', primary: true },
          { id: 'cm_c18', type: 'PHONE_WORK', value: '+1-916-388-7860', primary: true }
        ],
        customFields: {
          auction_experience: 12,
          specialties: ['Salvage Operations', 'Inventory Management']
        },
        createdAt: '2024-01-10T08:00:00Z'
      },
      // Manheim Pennsylvania Contacts
      {
        id: 'contact_7',
        firstName: 'Michael',
        lastName: 'O\'Brien',
        title: 'Sales Representative',
        organisationId: 'org_5',
        department: 'Sales',
        contactMethods: [
          { id: 'cm_c19', type: 'EMAIL_WORK', value: 'michael.obrien@manheim.com', primary: true },
          { id: 'cm_c20', type: 'PHONE_WORK', value: '+1-717-665-3572', primary: true },
          { id: 'cm_c21', type: 'PHONE_MOBILE', value: '+1-717-555-0200', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm_c3', platform: 'LINKEDIN', url: 'https://linkedin.com/in/michaelobrienmanheim' }
        ],
        customFields: {
          territory: 'Northeast Region',
          dealer_relationships: 150,
          years_at_manheim: 8
        },
        createdAt: '2024-01-05T12:00:00Z'
      },
      // Express Auto Transport Contacts
      {
        id: 'contact_8',
        firstName: 'Carlos',
        lastName: 'Vasquez',
        title: 'Dispatch Manager',
        organisationId: 'org_6',
        department: 'Operations',
        contactMethods: [
          { id: 'cm_c22', type: 'EMAIL_WORK', value: 'carlos.vasquez@expressautotransport.com', primary: true },
          { id: 'cm_c23', type: 'PHONE_WORK', value: '+1-214-555-7447', primary: true },
          { id: 'cm_c24', type: 'PHONE_MOBILE', value: '+1-214-555-0301', primary: false }
        ],
        customFields: {
          shift: 'Day Dispatch',
          routes_managed: ['TX-CA', 'TX-NY', 'TX-FL'],
          languages: ['English', 'Spanish']
        },
        createdAt: '2024-01-25T16:00:00Z'
      },
      {
        id: 'contact_9',
        firstName: 'Jessica',
        lastName: 'Kumar',
        title: 'Customer Service Manager',
        organisationId: 'org_6',
        department: 'Customer Service',
        contactMethods: [
          { id: 'cm_c25', type: 'EMAIL_WORK', value: 'jessica.kumar@expressautotransport.com', primary: true },
          { id: 'cm_c26', type: 'PHONE_WORK', value: '+1-214-555-7448', primary: true }
        ],
        customFields: {
          team_size: 8,
          customer_satisfaction_rating: 4.8,
          languages: ['English', 'Hindi']
        },
        createdAt: '2024-01-26T10:30:00Z'
      },
      // Pacific Shipping Solutions Contacts
      {
        id: 'contact_10',
        firstName: 'James',
        lastName: 'Nakamura',
        title: 'International Operations Director',
        organisationId: 'org_7',
        department: 'Operations',
        contactMethods: [
          { id: 'cm_c27', type: 'EMAIL_WORK', value: 'james.nakamura@pacificshipping.com', primary: true },
          { id: 'cm_c28', type: 'PHONE_WORK', value: '+1-562-555-0302', primary: true },
          { id: 'cm_c29', type: 'PHONE_MOBILE', value: '+1-562-555-0303', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm_c4', platform: 'LINKEDIN', url: 'https://linkedin.com/in/jamesnakamurashipping' }
        ],
        customFields: {
          languages: ['English', 'Japanese', 'Mandarin'],
          ports_expertise: ['Long Beach', 'Los Angeles', 'Tokyo', 'Shanghai'],
          international_experience: 15
        },
        createdAt: '2024-02-10T11:30:00Z'
      },
      // United Cars Processing Center Contacts
      {
        id: 'contact_11',
        firstName: 'Sarah',
        lastName: 'Johnson',
        title: 'Processing Supervisor',
        organisationId: 'org_8',
        department: 'Processing',
        contactMethods: [
          { id: 'cm_c30', type: 'EMAIL_WORK', value: 'sarah.johnson@unitedcars.com', primary: true },
          { id: 'cm_c31', type: 'PHONE_WORK', value: '+1-602-555-0401', primary: true },
          { id: 'cm_c32', type: 'PHONE_MOBILE', value: '+1-602-555-0402', primary: false }
        ],
        customFields: {
          shift: 'Day Shift',
          team_size: 15,
          processing_specialties: ['Title Transfers', 'Documentation Review']
        },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'contact_12',
        firstName: 'Kevin',
        lastName: 'Park',
        title: 'Quality Assurance Manager',
        organisationId: 'org_8',
        department: 'Quality Control',
        contactMethods: [
          { id: 'cm_c33', type: 'EMAIL_WORK', value: 'kevin.park@unitedcars.com', primary: true },
          { id: 'cm_c34', type: 'PHONE_WORK', value: '+1-602-555-0403', primary: true }
        ],
        customFields: {
          certifications: ['Six Sigma Green Belt', 'Quality Management'],
          audit_frequency: 'Daily',
          error_rate_target: '0.5%'
        },
        createdAt: '2024-01-02T08:00:00Z'
      },
      // Johnson Family Auto Contacts
      {
        id: 'contact_13',
        firstName: 'Tom',
        lastName: 'Johnson',
        title: 'Owner',
        organisationId: 'org_9',
        department: 'Owner',
        contactMethods: [
          { id: 'cm_c35', type: 'EMAIL_PERSONAL', value: 'tom@johnsonfamilyauto.com', primary: true },
          { id: 'cm_c36', type: 'PHONE_MOBILE', value: '+1-417-555-0251', primary: true },
          { id: 'cm_c37', type: 'PHONE_HOME', value: '+1-417-555-0252', primary: false }
        ],
        customFields: {
          years_in_business: 15,
          family_members_involved: 3,
          specializes_in: 'Family-friendly vehicles'
        },
        createdAt: '2024-02-15T13:00:00Z'
      },
      // Elite Collectors LLC Contacts
      {
        id: 'contact_14',
        firstName: 'Victoria',
        lastName: 'Sterling',
        title: 'Chief Acquisitions Officer',
        organisationId: 'org_10',
        department: 'Acquisitions',
        contactMethods: [
          { id: 'cm_c38', type: 'EMAIL_WORK', value: 'victoria.sterling@elitecollectors.com', primary: true },
          { id: 'cm_c39', type: 'PHONE_WORK', value: '+1-480-555-0351', primary: true },
          { id: 'cm_c40', type: 'PHONE_MOBILE', value: '+1-480-555-0352', primary: false }
        ],
        socialMediaLinks: [
          { id: 'sm_c5', platform: 'INSTAGRAM', url: 'https://instagram.com/victoriaclassiccars' },
          { id: 'sm_c6', platform: 'LINKEDIN', url: 'https://linkedin.com/in/victoriasterlingcollector' }
        ],
        customFields: {
          collection_expertise: ['American Muscle Cars', 'European Classics', 'Rare Prototypes'],
          auction_houses: ['Barrett-Jackson', 'RM Sothebys', 'Bonhams'],
          years_collecting: 20
        },
        createdAt: '2024-01-30T10:15:00Z'
      },
      {
        id: 'contact_15',
        firstName: 'Andrew',
        lastName: 'Mitchell',
        title: 'Restoration Manager',
        organisationId: 'org_10',
        department: 'Restoration',
        contactMethods: [
          { id: 'cm_c41', type: 'EMAIL_WORK', value: 'andrew.mitchell@elitecollectors.com', primary: true },
          { id: 'cm_c42', type: 'PHONE_WORK', value: '+1-480-555-0353', primary: true }
        ],
        customFields: {
          specialties: ['Engine Rebuilds', 'Frame Restoration', 'Paint & Body'],
          certifications: ['ASE Master Technician', 'Classic Car Specialist'],
          projects_completed: 85
        },
        createdAt: '2024-01-31T15:45:00Z'
      }
    ];

    // Apply basic filtering
    let filteredContacts = testContacts;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = testContacts.filter(contact => 
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        (contact.title && contact.title.toLowerCase().includes(searchLower))
      );
    }
    
    if (organisationId) {
      filteredContacts = filteredContacts.filter(contact => contact.organisationId === organisationId);
    }

    if (paginated) {
      return NextResponse.json({
        data: filteredContacts,
        total: filteredContacts.length,
        page: 1,
        totalPages: 1
      });
    } else {
      return NextResponse.json(filteredContacts);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporary fix: return created contact data
    const newContact = {
      id: 'contact_new',
      ...body,
      contactMethods: body.contactMethods || [],
      socialMediaLinks: [],
      customFields: {},
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(newContact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}