import { Contact, EntityType } from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { contactValidator } from '../validators';

class ContactRepositoryImpl extends BaseRepository<Contact> {
  constructor() {
    super();
    this.setValidator(contactValidator);
    this.setEntityType(EntityType.CONTACT);
  }

  async getByOrganisation(organisationId: string): Promise<Contact[]> {
    return this.list({ organisationId });
  }
}

export const contactRepository = new ContactRepositoryImpl();