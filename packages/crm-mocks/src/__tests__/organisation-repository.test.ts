import { describe, it, expect, beforeEach } from 'vitest';
import { organisationRepository } from '../repositories/organisation-repository';
import { makeOrganisation, OrganizationType, ContactMethodType } from '@united-cars/crm-core';

describe('OrganisationRepository', () => {
  beforeEach(() => {
    organisationRepository.clear();
  });

  describe('CRUD Operations', () => {
    it('should create an organisation', async () => {
      const org = makeOrganisation({
        name: 'Test Company',
        type: OrganizationType.DEALER,
        companyId: 'TEST-001'
      });

      const created = await organisationRepository.create(org);

      expect(created.id).toBe(org.id);
      expect(created.name).toBe('Test Company');
      expect(created.type).toBe(OrganizationType.DEALER);
    });

    it('should find organisation by id', async () => {
      const org = makeOrganisation({
        name: 'Find Me',
        type: OrganizationType.BROKER
      });

      await organisationRepository.create(org);
      const found = await organisationRepository.findById(org.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('Find Me');
    });

    it('should update organisation', async () => {
      const org = makeOrganisation({
        name: 'Original Name',
        type: OrganizationType.DEALER
      });

      await organisationRepository.create(org);

      const updated = await organisationRepository.update(org.id, {
        name: 'Updated Name',
        website: 'https://example.com'
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.website).toBe('https://example.com');
    });

    it('should delete organisation', async () => {
      const org = makeOrganisation({
        name: 'Delete Me',
        type: OrganizationType.DEALER
      });

      await organisationRepository.create(org);
      await organisationRepository.delete(org.id);

      const found = await organisationRepository.findById(org.id);
      expect(found).toBeUndefined();
    });

    it('should list all organisations', async () => {
      const org1 = makeOrganisation({ name: 'Org 1', type: OrganizationType.DEALER });
      const org2 = makeOrganisation({ name: 'Org 2', type: OrganizationType.BROKER });

      await organisationRepository.create(org1);
      await organisationRepository.create(org2);

      const all = await organisationRepository.list();

      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.some(o => o.name === 'Org 1')).toBe(true);
      expect(all.some(o => o.name === 'Org 2')).toBe(true);
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      await organisationRepository.create(
        makeOrganisation({ name: 'Dealer One', type: OrganizationType.DEALER, country: 'US' })
      );
      await organisationRepository.create(
        makeOrganisation({ name: 'Broker Two', type: OrganizationType.BROKER, country: 'CA' })
      );
      await organisationRepository.create(
        makeOrganisation({ name: 'Dealer Three', type: OrganizationType.DEALER, country: 'US' })
      );
    });

    it('should filter by type', async () => {
      const dealers = await organisationRepository.list({ type: OrganizationType.DEALER });

      expect(dealers.length).toBe(2);
      expect(dealers.every(d => d.type === OrganizationType.DEALER)).toBe(true);
    });

    it('should filter by country', async () => {
      const usOrgs = await organisationRepository.list({ country: 'US' });

      expect(usOrgs.length).toBe(2);
      expect(usOrgs.every(o => o.country === 'US')).toBe(true);
    });

    it('should filter by multiple criteria', async () => {
      const results = await organisationRepository.list({
        type: OrganizationType.DEALER,
        country: 'US'
      });

      expect(results.length).toBe(2);
      expect(results.every(r => r.type === OrganizationType.DEALER && r.country === 'US')).toBe(true);
    });
  });

  describe('Contact Methods', () => {
    it('should create organisation with multiple contact methods', async () => {
      const org = makeOrganisation({
        name: 'Multi Contact Org',
        type: OrganizationType.DEALER,
        contactMethods: [
          {
            id: 'cm1',
            type: ContactMethodType.EMAIL,
            value: 'primary@example.com',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cm2',
            type: ContactMethodType.EMAIL,
            value: 'secondary@example.com',
            isPrimary: false,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cm3',
            type: ContactMethodType.PHONE,
            value: '+1234567890',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const created = await organisationRepository.create(org);

      expect(created.contactMethods).toHaveLength(3);
      expect(created.contactMethods?.filter(cm => cm.type === ContactMethodType.EMAIL)).toHaveLength(2);
      expect(created.contactMethods?.filter(cm => cm.type === ContactMethodType.PHONE)).toHaveLength(1);
    });

    it('should update contact methods', async () => {
      const org = makeOrganisation({
        name: 'Update Contact Methods',
        type: OrganizationType.DEALER
      });

      const created = await organisationRepository.create(org);

      const updated = await organisationRepository.update(created.id, {
        contactMethods: [
          {
            id: 'new-cm',
            type: ContactMethodType.MOBILE,
            value: '+9876543210',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      expect(updated?.contactMethods).toHaveLength(1);
      expect(updated?.contactMethods?.[0].type).toBe(ContactMethodType.MOBILE);
    });
  });

  describe('Social Media', () => {
    it('should add social media links to organisation', async () => {
      const org = makeOrganisation({
        name: 'Social Org',
        type: OrganizationType.DEALER,
        socialMediaLinks: [
          {
            id: 'sm1',
            platform: 'FACEBOOK',
            url: 'https://facebook.com/testorg',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'sm2',
            platform: 'INSTAGRAM',
            url: 'https://instagram.com/testorg',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const created = await organisationRepository.create(org);

      expect(created.socialMediaLinks).toHaveLength(2);
      expect(created.socialMediaLinks?.[0].platform).toBe('FACEBOOK');
      expect(created.socialMediaLinks?.[1].platform).toBe('INSTAGRAM');
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await organisationRepository.create(
        makeOrganisation({ name: 'AutoMax Dealers', type: OrganizationType.DEALER })
      );
      await organisationRepository.create(
        makeOrganisation({ name: 'Premier Motors', type: OrganizationType.DEALER })
      );
      await organisationRepository.create(
        makeOrganisation({ name: 'Global Brokers Inc', type: OrganizationType.BROKER })
      );
    });

    it('should search by name', async () => {
      const results = await organisationRepository.search('Auto');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.includes('Auto'))).toBe(true);
    });

    it('should search case-insensitively', async () => {
      const results = await organisationRepository.search('automax');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.toLowerCase().includes('automax'))).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await organisationRepository.search('NONEXISTENT_ORG_12345');

      expect(results).toEqual([]);
    });
  });

  describe('Business Rules', () => {
    it('should enforce unique company ID', async () => {
      const org1 = makeOrganisation({
        name: 'First Org',
        type: OrganizationType.DEALER,
        companyId: 'UNIQUE-001'
      });

      await organisationRepository.create(org1);

      const org2 = makeOrganisation({
        name: 'Second Org',
        type: OrganizationType.DEALER,
        companyId: 'UNIQUE-001' // Same company ID
      });

      // Should throw or reject
      await expect(organisationRepository.create(org2)).rejects.toThrow();
    });

    it('should allow same name for different organisation types', async () => {
      const org1 = makeOrganisation({
        name: 'Same Name',
        type: OrganizationType.DEALER
      });

      const org2 = makeOrganisation({
        name: 'Same Name',
        type: OrganizationType.BROKER
      });

      await organisationRepository.create(org1);
      const created2 = await organisationRepository.create(org2);

      expect(created2.name).toBe('Same Name');
      expect(created2.type).toBe(OrganizationType.BROKER);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const org = makeOrganisation({
        name: 'Timestamp Test',
        type: OrganizationType.DEALER
      });

      const created = await organisationRepository.create(org);

      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
      expect(created.createdAt.getTime()).toBeLessThanOrEqual(created.updatedAt.getTime());
    });

    it('should update updatedAt on update', async () => {
      const org = makeOrganisation({
        name: 'Update Timestamp',
        type: OrganizationType.DEALER
      });

      const created = await organisationRepository.create(org);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await organisationRepository.update(created.id, {
        name: 'Updated Name'
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
