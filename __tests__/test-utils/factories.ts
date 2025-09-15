import { faker } from '@faker-js/faker';
import { 
  EnhancedOrganisation, 
  EnhancedContact, 
  EnhancedDeal, 
  EnhancedLead, 
  EnhancedTask, 
  EnhancedPipeline,
  EnhancedStage,
  ContactMethod,
  SocialMediaLink,
  CustomField,
  Activity,
  HistoryEntry
} from '@united-cars/crm-core';
import { 
  OrganisationType, 
  ContactMethodType, 
  SocialMediaPlatform, 
  DealStatus, 
  LeadStatus, 
  LeadSource,
  TaskStatus,
  TaskPriority,
  ActivityType,
  CustomFieldType,
  UserRole
} from '@united-cars/crm-core';

export class TestDataFactory {
  static createOrganisation(overrides: Partial<EnhancedOrganisation> = {}): EnhancedOrganisation {
    const baseOrg: EnhancedOrganisation = {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      name: faker.company.name(),
      type: faker.helpers.enumValue(OrganisationType),
      description: faker.lorem.paragraph(),
      website: faker.internet.url(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      contactMethods: [],
      socialMediaLinks: [],
      customFields: {},
      verified: faker.datatype.boolean(),
      verifiedAt: faker.date.past(),
      verifiedBy: faker.string.uuid(),
      assignedUserId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };

    // Add realistic contact methods
    baseOrg.contactMethods = [
      this.createContactMethod({ type: ContactMethodType.EMAIL, primary: true }),
      this.createContactMethod({ type: ContactMethodType.PHONE, primary: false })
    ];

    // Add social media links
    baseOrg.socialMediaLinks = [
      this.createSocialMediaLink({ platform: SocialMediaPlatform.FACEBOOK })
    ];

    return baseOrg;
  }

  static createContact(overrides: Partial<EnhancedContact> = {}): EnhancedContact {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      organisationId: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      title: faker.person.jobTitle(),
      department: faker.commerce.department(),
      contactMethods: [
        this.createContactMethod({ type: ContactMethodType.EMAIL, primary: true }),
        this.createContactMethod({ type: ContactMethodType.PHONE, primary: false })
      ],
      socialMediaLinks: [],
      customFields: {},
      verified: faker.datatype.boolean(),
      verifiedAt: faker.date.past(),
      verifiedBy: faker.string.uuid(),
      assignedUserId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createDeal(overrides: Partial<EnhancedDeal> = {}): EnhancedDeal {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      value: faker.number.int({ min: 1000, max: 100000 }),
      probability: faker.number.int({ min: 0, max: 100 }),
      expectedCloseDate: faker.date.future(),
      actualCloseDate: null,
      status: faker.helpers.enumValue(DealStatus),
      pipelineId: faker.string.uuid(),
      stageId: faker.string.uuid(),
      organisationId: faker.string.uuid(),
      contactId: faker.string.uuid(),
      leadId: null,
      dealSource: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Trade Show']),
      lossReason: null,
      nextAction: faker.lorem.sentence(),
      nextActionDate: faker.date.future(),
      customFields: {},
      assignedUserId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createLead(overrides: Partial<EnhancedLead> = {}): EnhancedLead {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      company: faker.company.name(),
      title: faker.person.jobTitle(),
      contactMethods: [
        this.createContactMethod({ type: ContactMethodType.EMAIL, primary: true })
      ],
      source: faker.helpers.enumValue(LeadSource),
      status: faker.helpers.enumValue(LeadStatus),
      score: faker.number.int({ min: 0, max: 100 }),
      isTarget: faker.datatype.boolean(),
      targetReason: faker.lorem.sentence(),
      notes: faker.lorem.paragraph(),
      convertedDealId: null,
      convertedAt: null,
      customFields: {},
      assignedUserId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createTask(overrides: Partial<EnhancedTask> = {}): EnhancedTask {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      title: faker.lorem.words(5),
      description: faker.lorem.paragraph(),
      status: faker.helpers.enumValue(TaskStatus),
      priority: faker.helpers.enumValue(TaskPriority),
      dueDate: faker.date.future(),
      completedAt: null,
      entityType: faker.helpers.arrayElement(['organisation', 'contact', 'deal', 'lead']),
      entityId: faker.string.uuid(),
      customFields: {},
      assignedUserId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createPipeline(overrides: Partial<EnhancedPipeline> = {}): EnhancedPipeline {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      isActive: true,
      stages: [
        this.createStage({ name: 'Prospecting', probability: 10, order: 0 }),
        this.createStage({ name: 'Qualification', probability: 25, order: 1 }),
        this.createStage({ name: 'Proposal', probability: 50, order: 2 }),
        this.createStage({ name: 'Negotiation', probability: 75, order: 3 }),
        this.createStage({ name: 'Closed Won', probability: 100, order: 4 })
      ],
      customFields: {},
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createStage(overrides: Partial<EnhancedStage> = {}): EnhancedStage {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      pipelineId: faker.string.uuid(),
      name: faker.lorem.word(),
      description: faker.lorem.sentence(),
      probability: faker.number.int({ min: 0, max: 100 }),
      order: faker.number.int({ min: 0, max: 10 }),
      color: faker.color.hex(),
      isActive: true,
      customFields: {},
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createContactMethod(overrides: Partial<ContactMethod> = {}): ContactMethod {
    const type = overrides.type || faker.helpers.enumValue(ContactMethodType);
    let value: string;
    
    switch (type) {
      case ContactMethodType.EMAIL:
        value = faker.internet.email();
        break;
      case ContactMethodType.PHONE:
        value = faker.phone.number();
        break;
      case ContactMethodType.FAX:
        value = faker.phone.number();
        break;
      case ContactMethodType.MOBILE:
        value = faker.phone.number();
        break;
      default:
        value = faker.lorem.word();
    }

    return {
      id: faker.string.uuid(),
      type,
      value,
      primary: overrides.primary || false,
      verified: faker.datatype.boolean(),
      verifiedAt: faker.date.past(),
      ...overrides
    };
  }

  static createSocialMediaLink(overrides: Partial<SocialMediaLink> = {}): SocialMediaLink {
    const platform = overrides.platform || faker.helpers.enumValue(SocialMediaPlatform);
    
    return {
      id: faker.string.uuid(),
      platform,
      url: faker.internet.url(),
      username: faker.internet.userName(),
      verified: faker.datatype.boolean(),
      verifiedAt: faker.date.past(),
      ...overrides
    };
  }

  static createCustomField(overrides: Partial<CustomField> = {}): CustomField {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(2),
      type: faker.helpers.enumValue(CustomFieldType),
      required: faker.datatype.boolean(),
      options: [],
      defaultValue: null,
      description: faker.lorem.sentence(),
      entityType: faker.helpers.arrayElement(['organisation', 'contact', 'deal', 'lead', 'task']),
      isActive: true,
      createdBy: faker.string.uuid(),
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  static createActivity(overrides: Partial<Activity> = {}): Activity {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      type: faker.helpers.enumValue(ActivityType),
      entityType: faker.helpers.arrayElement(['organisation', 'contact', 'deal', 'lead', 'task']),
      entityId: faker.string.uuid(),
      userId: faker.string.uuid(),
      description: faker.lorem.sentence(),
      metadata: {},
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  static createHistoryEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
    return {
      id: faker.string.uuid(),
      tenantId: 'test-tenant',
      entityType: faker.helpers.arrayElement(['organisation', 'contact', 'deal', 'lead', 'task']),
      entityId: faker.string.uuid(),
      operation: faker.helpers.arrayElement(['create', 'update', 'delete']),
      userId: faker.string.uuid(),
      userName: faker.person.fullName(),
      userRole: faker.helpers.enumValue(UserRole),
      changes: {},
      previousValues: {},
      newValues: {},
      reason: faker.lorem.sentence(),
      checksum: faker.string.alphanumeric(64),
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  // Helper methods for creating test scenarios
  static createOrganisationWithContacts(contactCount: number = 3): { 
    organisation: EnhancedOrganisation; 
    contacts: EnhancedContact[]; 
  } {
    const organisation = this.createOrganisation({ verified: true });
    const contacts = Array.from({ length: contactCount }, () => 
      this.createContact({ 
        organisationId: organisation.id,
        verified: true 
      })
    );

    return { organisation, contacts };
  }

  static createDealWithPipeline(): {
    pipeline: EnhancedPipeline;
    deal: EnhancedDeal;
  } {
    const pipeline = this.createPipeline();
    const deal = this.createDeal({
      pipelineId: pipeline.id,
      stageId: pipeline.stages[0].id,
      status: DealStatus.OPEN
    });

    return { pipeline, deal };
  }

  static createTargetLeadForConversion(): {
    lead: EnhancedLead;
    organisation: EnhancedOrganisation;
  } {
    const organisation = this.createOrganisation({ verified: true });
    const lead = this.createLead({
      isTarget: true,
      status: LeadStatus.QUALIFIED,
      targetReason: 'High potential customer based on profile analysis'
    });

    return { lead, organisation };
  }

  static createUniquenessConflictScenario(): {
    existingOrg: EnhancedOrganisation;
    conflictingOrg: Partial<EnhancedOrganisation>;
  } {
    const sharedEmail = faker.internet.email();
    const sharedPhone = faker.phone.number();

    const existingOrg = this.createOrganisation({
      contactMethods: [
        this.createContactMethod({ type: ContactMethodType.EMAIL, value: sharedEmail, primary: true }),
        this.createContactMethod({ type: ContactMethodType.PHONE, value: sharedPhone })
      ],
      verified: true
    });

    const conflictingOrg = {
      name: faker.company.name(),
      contactMethods: [
        this.createContactMethod({ type: ContactMethodType.EMAIL, value: sharedEmail, primary: true })
      ]
    };

    return { existingOrg, conflictingOrg };
  }

  static createRoleBasedTestData(): {
    adminUser: string;
    seniorManagerUser: string;
    juniorManagerUser: string;
    organisations: EnhancedOrganisation[];
  } {
    const adminUser = faker.string.uuid();
    const seniorManagerUser = faker.string.uuid();
    const juniorManagerUser = faker.string.uuid();

    const organisations = [
      this.createOrganisation({ assignedUserId: adminUser, createdBy: adminUser }),
      this.createOrganisation({ assignedUserId: seniorManagerUser, createdBy: seniorManagerUser }),
      this.createOrganisation({ assignedUserId: juniorManagerUser, createdBy: juniorManagerUser }),
      this.createOrganisation({ assignedUserId: adminUser, createdBy: seniorManagerUser })
    ];

    return { adminUser, seniorManagerUser, juniorManagerUser, organisations };
  }
}

export default TestDataFactory;