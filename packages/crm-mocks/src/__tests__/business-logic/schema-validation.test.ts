import { describe, it, expect } from 'vitest';
import {
  organisationSchema,
  contactSchema,
  leadSchema,
  dealSchema,
  taskSchema,
  contractSchema,
  pipelineSchema,
  stageSchema,
  activitySchema,
  createOrganisationSchema,
  createContactSchema,
  createLeadSchema,
  createDealSchema,
  createTaskSchema,
  createContractSchema,
  updateOrganisationSchema,
  updateDealSchema,
  convertLeadInputSchema,
  moveDealInputSchema,
  contactMethodSchema,
  socialMediaLinkSchema
} from '@united-cars/crm-core/src/schemas';
import {
  OrganizationType,
  ContactMethodType,
  ContactType,
  DealStatus,
  TaskStatus,
  TaskPriority,
  EntityType,
  SocialPlatform,
  ContractStatus,
  ContractType,
  LossReason
} from '@united-cars/crm-core';

describe('Schema Validation Business Logic', () => {
  describe('Contact Method Schema', () => {
    it('should accept valid email contact method', () => {
      const result = contactMethodSchema.safeParse({
        id: 'cm-1',
        type: ContactMethodType.EMAIL,
        value: 'test@example.com',
        isPrimary: true
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid phone contact method', () => {
      const result = contactMethodSchema.safeParse({
        id: 'cm-2',
        type: ContactMethodType.PHONE,
        value: '+1-555-123-4567',
        isPrimary: false,
        label: 'Mobile'
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty value', () => {
      const result = contactMethodSchema.safeParse({
        id: 'cm-3',
        type: ContactMethodType.EMAIL,
        value: ''
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Social Media Link Schema', () => {
    it('should accept valid social media link', () => {
      const result = socialMediaLinkSchema.safeParse({
        id: 'sm-1',
        platform: SocialPlatform.LINKEDIN,
        url: 'https://linkedin.com/in/johndoe',
        username: 'johndoe',
        isActive: true
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = socialMediaLinkSchema.safeParse({
        id: 'sm-2',
        platform: SocialPlatform.FACEBOOK,
        url: 'not-a-url'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Organisation Schema', () => {
    const validOrganisation = {
      id: 'org-1',
      tenantId: 'united-cars',
      name: 'Test Dealer Co',
      companyId: 'COMP-001',
      type: OrganizationType.DEALER,
      contactMethods: [
        { id: 'cm-1', type: ContactMethodType.PHONE, value: '+1-555-0001' }
      ],
      country: 'US',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid organisation', () => {
      const result = organisationSchema.safeParse(validOrganisation);
      expect(result.success).toBe(true);
    });

    it('should require at least one phone contact method', () => {
      const orgWithEmailOnly = {
        ...validOrganisation,
        contactMethods: [
          { id: 'cm-1', type: ContactMethodType.EMAIL, value: 'test@example.com' }
        ]
      };

      const result = organisationSchema.safeParse(orgWithEmailOnly);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i =>
          i.message.includes('phone') || i.message.includes('PHONE')
        )).toBe(true);
      }
    });

    it('should validate country code format', () => {
      const orgWithInvalidCountry = {
        ...validOrganisation,
        country: 'USA' // Should be 2-letter code
      };

      const result = organisationSchema.safeParse(orgWithInvalidCountry);
      expect(result.success).toBe(false);
    });

    it('should require name', () => {
      const orgWithoutName = { ...validOrganisation, name: '' };
      const result = organisationSchema.safeParse(orgWithoutName);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const orgWithOptionals = {
        ...validOrganisation,
        website: 'https://dealer.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        industry: 'Automotive',
        notes: 'VIP customer',
        tags: ['dealer', 'premium']
      };

      const result = organisationSchema.safeParse(orgWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('Contact Schema', () => {
    const validContact = {
      id: 'contact-1',
      tenantId: 'united-cars',
      firstName: 'John',
      lastName: 'Doe',
      type: ContactType.SALES,
      contactMethods: [
        { id: 'cm-1', type: ContactMethodType.PHONE, value: '+1-555-0001' }
      ],
      country: 'US',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid contact', () => {
      const result = contactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it('should require first and last name', () => {
      const contactWithoutName = { ...validContact, firstName: '', lastName: '' };
      const result = contactSchema.safeParse(contactWithoutName);
      expect(result.success).toBe(false);
    });

    it('should require phone contact method', () => {
      const contactEmailOnly = {
        ...validContact,
        contactMethods: [
          { id: 'cm-1', type: ContactMethodType.EMAIL, value: 'john@example.com' }
        ]
      };

      const result = contactSchema.safeParse(contactEmailOnly);
      expect(result.success).toBe(false);
    });
  });

  describe('Lead Schema', () => {
    const validLead = {
      id: 'lead-1',
      tenantId: 'united-cars',
      title: 'New Lead',
      isTarget: true,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid lead', () => {
      const result = leadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it('should accept lead with contact info', () => {
      const leadWithContact = {
        ...validLead,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0002',
        company: 'Acme Corp',
        jobTitle: 'Manager'
      };

      const result = leadSchema.safeParse(leadWithContact);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const leadWithBadEmail = {
        ...validLead,
        email: 'not-an-email'
      };

      const result = leadSchema.safeParse(leadWithBadEmail);
      expect(result.success).toBe(false);
    });

    it('should accept empty string as email', () => {
      const leadWithEmptyEmail = {
        ...validLead,
        email: ''
      };

      const result = leadSchema.safeParse(leadWithEmptyEmail);
      expect(result.success).toBe(true);
    });

    it('should validate archived reason enum', () => {
      const archivedLead = {
        ...validLead,
        isArchived: true,
        archivedAt: new Date(),
        archivedReason: 'converted'
      };

      const result = leadSchema.safeParse(archivedLead);
      expect(result.success).toBe(true);
    });

    it('should reject invalid archived reason', () => {
      const invalidArchived = {
        ...validLead,
        archivedReason: 'invalid_reason'
      };

      const result = leadSchema.safeParse(invalidArchived);
      expect(result.success).toBe(false);
    });
  });

  describe('Deal Schema', () => {
    const validDeal = {
      id: 'deal-1',
      tenantId: 'united-cars',
      title: 'Vehicle Purchase',
      status: DealStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid deal', () => {
      const result = dealSchema.safeParse(validDeal);
      expect(result.success).toBe(true);
    });

    it('should accept deal with financial info', () => {
      const dealWithFinancials = {
        ...validDeal,
        amount: 50000,
        currency: 'USD',
        probability: 75
      };

      const result = dealSchema.safeParse(dealWithFinancials);
      expect(result.success).toBe(true);
    });

    it('should validate currency format', () => {
      const dealWithBadCurrency = {
        ...validDeal,
        currency: 'DOLLARS'
      };

      const result = dealSchema.safeParse(dealWithBadCurrency);
      expect(result.success).toBe(false);
    });

    it('should validate probability range', () => {
      const dealOverProb = { ...validDeal, probability: 150 };
      const dealUnderProb = { ...validDeal, probability: -10 };

      expect(dealSchema.safeParse(dealOverProb).success).toBe(false);
      expect(dealSchema.safeParse(dealUnderProb).success).toBe(false);
    });

    it('should accept valid loss reason', () => {
      const lostDeal = {
        ...validDeal,
        status: DealStatus.LOST,
        lossReason: LossReason.REJECTION
      };

      const result = dealSchema.safeParse(lostDeal);
      expect(result.success).toBe(true);
    });
  });

  describe('Task Schema', () => {
    const validTask = {
      id: 'task-1',
      tenantId: 'united-cars',
      title: 'Follow up call',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      targetType: EntityType.DEAL,
      targetId: 'deal-1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid task', () => {
      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const taskWithoutTitle = { ...validTask, title: '' };
      const result = taskSchema.safeParse(taskWithoutTitle);
      expect(result.success).toBe(false);
    });

    it('should validate status enum', () => {
      const taskWithBadStatus = { ...validTask, status: 'INVALID' };
      const result = taskSchema.safeParse(taskWithBadStatus);
      expect(result.success).toBe(false);
    });

    it('should validate priority enum', () => {
      const taskWithBadPriority = { ...validTask, priority: 'SUPER_URGENT' };
      const result = taskSchema.safeParse(taskWithBadPriority);
      expect(result.success).toBe(false);
    });

    it('should accept optional dates and tags', () => {
      const taskWithOptionals = {
        ...validTask,
        dueDate: new Date('2025-12-31'),
        completedAt: new Date(),
        assigneeId: 'user-1',
        description: 'Call to discuss terms',
        tags: ['urgent', 'client']
      };

      const result = taskSchema.safeParse(taskWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('Contract Schema', () => {
    const validContract = {
      id: 'contract-1',
      tenantId: 'united-cars',
      title: 'Service Agreement',
      contractNumber: 'CNT-001',
      type: ContractType.SERVICE,
      status: ContractStatus.DRAFT,
      organisationId: 'org-1',
      contactIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid contract', () => {
      const result = contractSchema.safeParse(validContract);
      expect(result.success).toBe(true);
    });

    it('should require organisation', () => {
      const contractWithoutOrg = { ...validContract, organisationId: '' };
      const result = contractSchema.safeParse(contractWithoutOrg);
      expect(result.success).toBe(false);
    });

    it('should validate date constraints - end date after effective date', () => {
      const contractWithBadDates = {
        ...validContract,
        effectiveDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01') // Before effective date
      };

      const result = contractSchema.safeParse(contractWithBadDates);
      expect(result.success).toBe(false);
    });

    it('should validate signed date after sent date', () => {
      const contractWithBadSignDate = {
        ...validContract,
        sentDate: new Date('2025-06-01'),
        signedDate: new Date('2025-01-01') // Before sent date
      };

      const result = contractSchema.safeParse(contractWithBadSignDate);
      expect(result.success).toBe(false);
    });

    it('should accept valid date sequence', () => {
      const contractWithDates = {
        ...validContract,
        effectiveDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        sentDate: new Date('2024-12-01'),
        signedDate: new Date('2024-12-15')
      };

      const result = contractSchema.safeParse(contractWithDates);
      expect(result.success).toBe(true);
    });
  });

  describe('Pipeline Schema', () => {
    const validPipeline = {
      id: 'pipeline-1',
      tenantId: 'united-cars',
      name: 'Sales Pipeline',
      order: 1,
      applicableTypes: [OrganizationType.DEALER],
      isTypeSpecific: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid pipeline', () => {
      const result = pipelineSchema.safeParse(validPipeline);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const pipelineWithoutName = { ...validPipeline, name: '' };
      const result = pipelineSchema.safeParse(pipelineWithoutName);
      expect(result.success).toBe(false);
    });
  });

  describe('Stage Schema', () => {
    const validStage = {
      id: 'stage-1',
      tenantId: 'united-cars',
      pipelineId: 'pipeline-1',
      name: 'Qualification',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid stage', () => {
      const result = stageSchema.safeParse(validStage);
      expect(result.success).toBe(true);
    });

    it('should accept optional properties', () => {
      const stageWithOptionals = {
        ...validStage,
        color: '#FF5733',
        wipLimit: 10,
        slaTarget: 48,
        isClosing: false,
        isLost: false
      };

      const result = stageSchema.safeParse(stageWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('Convert Lead Input Schema', () => {
    it('should accept valid convert input', () => {
      const result = convertLeadInputSchema.safeParse({
        title: 'Converted Deal'
      });

      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = convertLeadInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = convertLeadInputSchema.safeParse({
        title: 'New Deal',
        amount: 25000,
        currency: 'EUR',
        pipelineId: 'pipeline-1',
        stageId: 'stage-2',
        notes: 'Converted from lead'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Move Deal Input Schema', () => {
    it('should accept valid move input', () => {
      const result = moveDealInputSchema.safeParse({
        pipelineId: 'pipeline-1',
        toStageId: 'stage-3'
      });

      expect(result.success).toBe(true);
    });

    it('should require pipelineId and toStageId', () => {
      const result = moveDealInputSchema.safeParse({
        pipelineId: 'pipeline-1'
      });

      expect(result.success).toBe(false);
    });

    it('should accept loss reason', () => {
      const result = moveDealInputSchema.safeParse({
        pipelineId: 'pipeline-1',
        toStageId: 'stage-lost',
        lossReason: LossReason.STOPPED_WORKING,
        note: 'Customer stopped responding'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Create Schemas', () => {
    it('createOrganisationSchema should omit system fields', () => {
      const input = {
        name: 'New Dealer',
        companyId: 'COMP-NEW',
        type: OrganizationType.DEALER,
        contactMethods: [
          { id: 'cm-1', type: ContactMethodType.PHONE, value: '+1-555-9999' }
        ],
        country: 'US'
      };

      const result = createOrganisationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('createContactSchema should omit system fields', () => {
      const input = {
        firstName: 'New',
        lastName: 'Contact',
        type: ContactType.SALES,
        contactMethods: [
          { id: 'cm-1', type: ContactMethodType.PHONE, value: '+1-555-8888' }
        ],
        country: 'CA'
      };

      const result = createContactSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('createDealSchema should omit system and stage fields', () => {
      const input = {
        title: 'New Deal',
        status: DealStatus.OPEN
      };

      const result = createDealSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('createTaskSchema should omit system fields', () => {
      const input = {
        title: 'New Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        targetType: EntityType.DEAL,
        targetId: 'deal-123'
      };

      const result = createTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('createContractSchema should make contractNumber optional', () => {
      const input = {
        title: 'New Contract',
        type: ContractType.SERVICE,
        status: ContractStatus.DRAFT,
        organisationId: 'org-1'
      };

      const result = createContractSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('Update Schemas', () => {
    it('updateOrganisationSchema should allow partial updates', () => {
      const result = updateOrganisationSchema.safeParse({
        name: 'Updated Name'
      });

      expect(result.success).toBe(true);
    });

    it('updateDealSchema should allow partial updates', () => {
      const result = updateDealSchema.safeParse({
        amount: 75000,
        probability: 90
      });

      expect(result.success).toBe(true);
    });

    it('updateDealSchema should still validate currency when provided', () => {
      const result = updateDealSchema.safeParse({
        currency: 'INVALID'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Activity Schema', () => {
    const validActivity = {
      id: 'activity-1',
      tenantId: 'united-cars',
      entityType: EntityType.DEAL,
      entityId: 'deal-1',
      type: 'CREATED',
      description: 'Deal was created',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should accept valid activity', () => {
      const result = activitySchema.safeParse(validActivity);
      expect(result.success).toBe(true);
    });

    it('should accept activity with metadata', () => {
      const activityWithMeta = {
        ...validActivity,
        meta: {
          previousValue: 1000,
          newValue: 2000
        },
        userId: 'user-1'
      };

      const result = activitySchema.safeParse(activityWithMeta);
      expect(result.success).toBe(true);
    });
  });
});
