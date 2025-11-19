import { describe, it, expect, beforeEach } from 'vitest';
import { contactRepository } from '../repositories/contact-repository';
import { organisationRepository } from '../repositories/organisation-repository';
import { makeContact, makeOrganisation, OrganizationType, ContactType, ContactMethodType } from '@united-cars/crm-core';

describe('ContactRepository', () => {
  let testOrgId: string;

  beforeEach(async () => {
    contactRepository.clear();
    organisationRepository.clear();

    // Create test organisation
    const org = makeOrganisation({
      name: 'Test Organisation',
      type: OrganizationType.DEALER
    });
    const createdOrg = await organisationRepository.create(org);
    testOrgId = createdOrg.id;
  });

  describe('CRUD Operations', () => {
    it('should create a contact', async () => {
      const contact = makeContact({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        organisationId: testOrgId
      });

      const created = await contactRepository.create(contact);

      expect(created.id).toBe(contact.id);
      expect(created.firstName).toBe('John');
      expect(created.lastName).toBe('Doe');
      expect(created.email).toBe('john.doe@example.com');
    });

    it('should create contact without organisation', async () => {
      const contact = makeContact({
        firstName: 'Independent',
        lastName: 'Person',
        email: 'independent@example.com'
      });

      const created = await contactRepository.create(contact);

      expect(created.organisationId).toBeUndefined();
      expect(created.firstName).toBe('Independent');
    });

    it('should find contact by id', async () => {
      const contact = makeContact({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      });

      await contactRepository.create(contact);
      const found = await contactRepository.findById(contact.id);

      expect(found).toBeDefined();
      expect(found?.firstName).toBe('Jane');
    });

    it('should update contact', async () => {
      const contact = makeContact({
        firstName: 'Update',
        lastName: 'Test',
        email: 'update@example.com'
      });

      await contactRepository.create(contact);

      const updated = await contactRepository.update(contact.id, {
        firstName: 'Updated',
        title: 'Senior Manager',
        phone: '+1234567890'
      });

      expect(updated?.firstName).toBe('Updated');
      expect(updated?.title).toBe('Senior Manager');
      expect(updated?.phone).toBe('+1234567890');
    });

    it('should delete contact', async () => {
      const contact = makeContact({
        firstName: 'Delete',
        lastName: 'Me',
        email: 'delete@example.com'
      });

      await contactRepository.create(contact);
      await contactRepository.delete(contact.id);

      const found = await contactRepository.findById(contact.id);
      expect(found).toBeUndefined();
    });

    it('should list all contacts', async () => {
      const contact1 = makeContact({ firstName: 'Alice', lastName: 'A', email: 'alice@example.com' });
      const contact2 = makeContact({ firstName: 'Bob', lastName: 'B', email: 'bob@example.com' });

      await contactRepository.create(contact1);
      await contactRepository.create(contact2);

      const all = await contactRepository.list();

      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.some(c => c.firstName === 'Alice')).toBe(true);
      expect(all.some(c => c.firstName === 'Bob')).toBe(true);
    });
  });

  describe('Organisation Relationship', () => {
    it('should link contact to organisation', async () => {
      const contact = makeContact({
        firstName: 'Linked',
        lastName: 'Contact',
        email: 'linked@example.com',
        organisationId: testOrgId
      });

      const created = await contactRepository.create(contact);

      expect(created.organisationId).toBe(testOrgId);
    });

    it('should filter contacts by organisation', async () => {
      const org2 = await organisationRepository.create(
        makeOrganisation({ name: 'Org 2', type: OrganizationType.BROKER })
      );

      await contactRepository.create(
        makeContact({ firstName: 'Org1Contact', lastName: 'One', email: 'org1@example.com', organisationId: testOrgId })
      );
      await contactRepository.create(
        makeContact({ firstName: 'Org2Contact', lastName: 'Two', email: 'org2@example.com', organisationId: org2.id })
      );

      const org1Contacts = await contactRepository.list({ organisationId: testOrgId });

      expect(org1Contacts.length).toBe(1);
      expect(org1Contacts[0].firstName).toBe('Org1Contact');
    });

    it('should update contact organisation', async () => {
      const contact = makeContact({
        firstName: 'Move',
        lastName: 'Contact',
        email: 'move@example.com'
      });

      const created = await contactRepository.create(contact);

      const updated = await contactRepository.update(created.id, {
        organisationId: testOrgId
      });

      expect(updated?.organisationId).toBe(testOrgId);
    });
  });

  describe('Contact Methods', () => {
    it('should create contact with multiple emails', async () => {
      const contact = makeContact({
        firstName: 'Multi',
        lastName: 'Email',
        email: 'primary@example.com',
        contactMethods: [
          {
            id: 'cm1',
            type: ContactMethodType.EMAIL,
            value: 'secondary@example.com',
            isPrimary: false,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cm2',
            type: ContactMethodType.EMAIL,
            value: 'work@example.com',
            isPrimary: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const created = await contactRepository.create(contact);

      expect(created.contactMethods).toHaveLength(2);
      const emails = created.contactMethods?.filter(cm => cm.type === ContactMethodType.EMAIL);
      expect(emails?.length).toBe(2);
    });

    it('should create contact with multiple phone numbers', async () => {
      const contact = makeContact({
        firstName: 'Multi',
        lastName: 'Phone',
        email: 'phone@example.com',
        contactMethods: [
          {
            id: 'cm1',
            type: ContactMethodType.PHONE,
            value: '+1234567890',
            label: 'Work',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'cm2',
            type: ContactMethodType.MOBILE,
            value: '+9876543210',
            label: 'Mobile',
            isPrimary: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const created = await contactRepository.create(contact);

      expect(created.contactMethods).toHaveLength(2);
      const phones = created.contactMethods?.filter(
        cm => cm.type === ContactMethodType.PHONE || cm.type === ContactMethodType.MOBILE
      );
      expect(phones?.length).toBe(2);
    });

    it('should add contact method to existing contact', async () => {
      const contact = makeContact({
        firstName: 'Add',
        lastName: 'Method',
        email: 'add@example.com'
      });

      const created = await contactRepository.create(contact);

      const updated = await contactRepository.update(created.id, {
        contactMethods: [
          {
            id: 'new-cm',
            type: ContactMethodType.MOBILE,
            value: '+1111111111',
            isPrimary: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      expect(updated?.contactMethods).toHaveLength(1);
    });
  });

  describe('Contact Types', () => {
    it('should create primary contact', async () => {
      const contact = makeContact({
        firstName: 'Primary',
        lastName: 'Contact',
        email: 'primary@example.com',
        type: ContactType.PRIMARY,
        organisationId: testOrgId
      });

      const created = await contactRepository.create(contact);

      expect(created.type).toBe(ContactType.PRIMARY);
    });

    it('should filter contacts by type', async () => {
      await contactRepository.create(
        makeContact({ firstName: 'Primary', lastName: 'One', email: 'p1@example.com', type: ContactType.PRIMARY })
      );
      await contactRepository.create(
        makeContact({ firstName: 'Secondary', lastName: 'Two', email: 's1@example.com', type: ContactType.SECONDARY })
      );

      const primaryContacts = await contactRepository.list({ type: ContactType.PRIMARY });

      expect(primaryContacts.length).toBe(1);
      expect(primaryContacts[0].type).toBe(ContactType.PRIMARY);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await contactRepository.create(
        makeContact({ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' })
      );
      await contactRepository.create(
        makeContact({ firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' })
      );
      await contactRepository.create(
        makeContact({ firstName: 'Bob', lastName: 'Johnson', email: 'bob.j@example.com' })
      );
    });

    it('should search by first name', async () => {
      const results = await contactRepository.search('John');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.firstName === 'John')).toBe(true);
    });

    it('should search by last name', async () => {
      const results = await contactRepository.search('Smith');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.lastName === 'Smith')).toBe(true);
    });

    it('should search by email', async () => {
      const results = await contactRepository.search('jane.smith');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.email?.includes('jane.smith'))).toBe(true);
    });

    it('should search case-insensitively', async () => {
      const results = await contactRepository.search('JOHN');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const results = await contactRepository.search('NONEXISTENT_CONTACT');

      expect(results).toEqual([]);
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      await contactRepository.create(
        makeContact({ firstName: 'US', lastName: 'Contact', email: 'us@example.com', country: 'US' })
      );
      await contactRepository.create(
        makeContact({ firstName: 'CA', lastName: 'Contact', email: 'ca@example.com', country: 'CA' })
      );
    });

    it('should filter by country', async () => {
      const usContacts = await contactRepository.list({ country: 'US' });

      expect(usContacts.length).toBe(1);
      expect(usContacts[0].country).toBe('US');
    });
  });

  describe('Business Rules', () => {
    it('should enforce unique email per organisation', async () => {
      const contact1 = makeContact({
        firstName: 'First',
        lastName: 'Person',
        email: 'same@example.com',
        organisationId: testOrgId
      });

      await contactRepository.create(contact1);

      const contact2 = makeContact({
        firstName: 'Second',
        lastName: 'Person',
        email: 'same@example.com',
        organisationId: testOrgId
      });

      // Should throw or reject
      await expect(contactRepository.create(contact2)).rejects.toThrow();
    });

    it('should allow same email for different organisations', async () => {
      const org2 = await organisationRepository.create(
        makeOrganisation({ name: 'Org 2', type: OrganizationType.BROKER })
      );

      const contact1 = makeContact({
        firstName: 'Person',
        lastName: 'One',
        email: 'shared@example.com',
        organisationId: testOrgId
      });

      const contact2 = makeContact({
        firstName: 'Person',
        lastName: 'Two',
        email: 'shared@example.com',
        organisationId: org2.id
      });

      await contactRepository.create(contact1);
      const created2 = await contactRepository.create(contact2);

      expect(created2.email).toBe('shared@example.com');
      expect(created2.organisationId).toBe(org2.id);
    });
  });

  describe('Timestamps', () => {
    it('should set timestamps on creation', async () => {
      const contact = makeContact({
        firstName: 'Time',
        lastName: 'Test',
        email: 'time@example.com'
      });

      const created = await contactRepository.create(contact);

      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on update', async () => {
      const contact = makeContact({
        firstName: 'Update',
        lastName: 'Time',
        email: 'updatetime@example.com'
      });

      const created = await contactRepository.create(contact);
      const originalUpdatedAt = created.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await contactRepository.update(created.id, {
        firstName: 'Updated'
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
