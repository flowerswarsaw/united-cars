import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { leadRepository } from '../../repositories/lead-repository';
import { contactRepository } from '../../repositories/contact-repository';
import { organisationRepository } from '../../repositories/organisation-repository';
import { pipelineRepository, dealRepository, pipelines, dealerAcquisitionStages } from '../../seeds';
import { ContactMethodType, ContactType, DealStatus } from '@united-cars/crm-core';

describe('Lead Conversion Business Logic', () => {
  // Seed pipelines before all tests
  beforeAll(async () => {
    // Clear existing data
    pipelineRepository.clear();
    dealRepository.clear();

    // Seed pipelines and stages
    pipelineRepository.fromJSON(pipelines);
    pipelineRepository.stagesFromJSON(dealerAcquisitionStages);
  });

  // Clear mutable data before each test for isolation
  beforeEach(async () => {
    // Clear contacts, leads, and deals for test isolation
    contactRepository.clear();
    leadRepository.clear();
    dealRepository.clear();
    organisationRepository.clear();
  });

  // Helper to create a test lead
  const createTestLead = async (overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    organisationId: string;
    isTarget: boolean;
    contactId: string;
    convertedDealId: string;
    isArchived: boolean;
  }> = {}) => {
    const lead = await leadRepository.create({
      title: `Test Lead - ${Date.now()}`,
      firstName: overrides.firstName || 'John',
      lastName: overrides.lastName || 'Doe',
      email: overrides.email || `test-${Date.now()}@example.com`,
      phone: overrides.phone || `+1555${Date.now().toString().slice(-7)}`,
      source: 'website',
      status: 'new',
      isTarget: overrides.isTarget !== undefined ? overrides.isTarget : true,
      organisationId: overrides.organisationId,
      contactId: overrides.contactId,
      convertedDealId: overrides.convertedDealId,
      isArchived: overrides.isArchived || false
    } as any);
    return lead;
  };

  // Helper to create a test organisation
  const createTestOrganisation = async () => {
    const org = await organisationRepository.create({
      name: `Test Org - ${Date.now()}`,
      type: 'DEALER' as any
    } as any);
    return org;
  };

  // Helper to create a test contact
  const createTestContact = async (email?: string, phone?: string) => {
    const contactMethods = [];
    if (email) {
      contactMethods.push({
        id: `email-${Date.now()}`,
        type: ContactMethodType.EMAIL,
        value: email,
        isPrimary: true
      });
    }
    if (phone) {
      contactMethods.push({
        id: `phone-${Date.now()}`,
        type: ContactMethodType.PHONE,
        value: phone,
        isPrimary: !email
      });
    }

    const contact = await contactRepository.create({
      firstName: 'Existing',
      lastName: 'Contact',
      type: ContactType.SALES,
      contactMethods
    } as any);
    return contact;
  };

  describe('B1 Fix: Deal created with valid organisationId', () => {
    it('should create deal with organisationId from lead when lead has organisation', async () => {
      // Create organisation and lead
      const org = await createTestOrganisation();
      const lead = await createTestLead({ organisationId: org.id });

      // Convert lead
      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      expect(deal).toBeDefined();
      expect(deal.organisationId).toBe(org.id);
    });

    it('should create deal with undefined organisationId when lead has no organisation', async () => {
      const lead = await createTestLead({ organisationId: undefined });

      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      expect(deal).toBeDefined();
      // When lead has no organisation, deal should have undefined organisationId
      expect(deal.organisationId).toBeUndefined();
    });
  });

  describe('B3 Fix: Double conversion prevention', () => {
    it('should throw error when trying to convert an already converted lead', async () => {
      const lead = await createTestLead();

      // First conversion should succeed
      const deal1 = await leadRepository.convertToDeal(lead.id, {
        title: 'First Deal'
      });
      expect(deal1).toBeDefined();

      // Second conversion should throw
      await expect(
        leadRepository.convertToDeal(lead.id, { title: 'Second Deal' })
      ).rejects.toThrow('Lead has already been converted to a deal');
    });

    it('should allow conversion of different leads', async () => {
      const lead1 = await createTestLead({ email: `lead1-${Date.now()}@test.com` });
      const lead2 = await createTestLead({ email: `lead2-${Date.now()}@test.com` });

      const deal1 = await leadRepository.convertToDeal(lead1.id, { title: 'Deal 1' });
      const deal2 = await leadRepository.convertToDeal(lead2.id, { title: 'Deal 2' });

      expect(deal1.id).not.toBe(deal2.id);
    });
  });

  describe('B9 Fix: Contact uniqueness on lead conversion', () => {
    it('should reuse existing contact when lead has matching email', async () => {
      const testEmail = `unique-${Date.now()}@test.com`;

      // Create existing contact with email
      const existingContact = await createTestContact(testEmail);

      // Create lead with same email
      const lead = await createTestLead({ email: testEmail });

      // Convert lead
      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Should use existing contact
      expect(deal.contactId).toBe(existingContact.id);
    });

    it('should reuse existing contact when lead has matching phone', async () => {
      const testPhone = `+1555${Date.now().toString().slice(-7)}`;

      // Create existing contact with phone
      const existingContact = await createTestContact(undefined, testPhone);

      // Create lead with same phone but different email
      const lead = await createTestLead({
        email: `different-${Date.now()}@test.com`,
        phone: testPhone
      });

      // Convert lead
      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Should use existing contact
      expect(deal.contactId).toBe(existingContact.id);
    });

    it('should create new contact when no matching contact exists', async () => {
      const uniqueEmail = `brand-new-${Date.now()}@test.com`;
      const uniquePhone = `+1999${Date.now().toString().slice(-7)}`;

      // Create lead with unique email/phone
      const lead = await createTestLead({
        email: uniqueEmail,
        phone: uniquePhone
      });

      // Convert lead
      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Should have created a new contact
      expect(deal.contactId).toBeDefined();

      // Verify the contact was created
      const contact = await contactRepository.get(deal.contactId!);
      expect(contact).toBeDefined();
      expect(contact?.contactMethods?.some(m =>
        m.type === ContactMethodType.EMAIL && m.value === uniqueEmail
      )).toBe(true);
    });
  });

  describe('B10 Fix: Contact org assignment on lead conversion', () => {
    it('should assign organisation to newly created contact from lead', async () => {
      const uniqueEmail = `org-test-${Date.now()}@test.com`;

      // Create organisation
      const org = await createTestOrganisation();

      // Create lead with organisation
      const lead = await createTestLead({
        email: uniqueEmail,
        organisationId: org.id
      });

      // Convert lead
      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Verify the contact was created with organisation
      const contact = await contactRepository.get(deal.contactId!);
      expect(contact).toBeDefined();
      expect(contact?.organisationId).toBe(org.id);
    });
  });

  describe('Validation Rules', () => {
    it('should reject conversion of non-target lead', async () => {
      const lead = await createTestLead({ isTarget: false });

      await expect(
        leadRepository.convertToDeal(lead.id, { title: 'Test Deal' })
      ).rejects.toThrow('Only target leads can be converted to deals');
    });

    it('should reject conversion of archived lead', async () => {
      const lead = await createTestLead({ isArchived: true });

      await expect(
        leadRepository.convertToDeal(lead.id, { title: 'Test Deal' })
      ).rejects.toThrow('Cannot convert archived lead');
    });

    it('should reject conversion of non-existent lead', async () => {
      await expect(
        leadRepository.convertToDeal('non-existent-id', { title: 'Test Deal' })
      ).rejects.toThrow('Lead not found');
    });
  });

  describe('Successful Conversion Flow', () => {
    it('should archive lead after successful conversion', async () => {
      const lead = await createTestLead();

      await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Verify lead is archived
      const updatedLead = await leadRepository.get(lead.id);
      expect(updatedLead?.isArchived).toBe(true);
      expect(updatedLead?.archivedReason).toBe('converted');
    });

    it('should set convertedDealId on lead after conversion', async () => {
      const lead = await createTestLead();

      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Verify lead has reference to deal
      const updatedLead = await leadRepository.get(lead.id);
      expect(updatedLead?.convertedDealId).toBe(deal.id);
    });

    it('should use provided pipeline/stage when specified', async () => {
      const lead = await createTestLead();

      // Get available pipeline
      const pipelines = await pipelineRepository.list();
      const pipeline = pipelines[0];
      const stages = await pipelineRepository.getStages(pipeline.id);
      const stage = stages[1]; // Not the first stage

      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal',
        pipelineId: pipeline.id,
        stageId: stage.id
      });

      // Check via currentStages
      expect(deal.currentStages?.[0]?.pipelineId).toBe(pipeline.id);
      expect(deal.currentStages?.[0]?.stageId).toBe(stage.id);
    });

    it('should assign deal to default pipeline when not specified', async () => {
      const lead = await createTestLead();

      const deal = await leadRepository.convertToDeal(lead.id, {
        title: 'Test Deal'
      });

      // Deal should have a pipeline assigned
      expect(deal.currentStages).toBeDefined();
      expect(deal.currentStages?.length).toBeGreaterThan(0);
      expect(deal.currentStages?.[0]?.pipelineId).toBeDefined();
    });
  });
});
