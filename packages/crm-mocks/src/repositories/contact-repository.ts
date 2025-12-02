import { Contact, EntityType } from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { contactValidator, setContactRepository } from '../validators';

class ContactRepositoryImpl extends BaseRepository<Contact> {
  constructor() {
    super();
    this.setValidator(contactValidator);
    this.setEntityType(EntityType.CONTACT);
    // Set self-reference for unique email per org validation
    setContactRepository(this);
  }

  async getByOrganisation(organisationId: string): Promise<Contact[]> {
    return this.list({ organisationId });
  }

  // Override search to include email field
  async search(query: string, searchFields?: (keyof Contact)[]): Promise<Contact[]> {
    const defaultContactSearchFields: (keyof Contact)[] = ['firstName', 'lastName', 'email', 'title'];
    return super.search(query, searchFields || defaultContactSearchFields);
  }
}

export class ContactRepository extends ContactRepositoryImpl {}
export const contactRepository = new ContactRepositoryImpl();