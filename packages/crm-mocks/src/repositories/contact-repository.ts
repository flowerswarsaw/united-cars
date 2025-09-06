import { Contact } from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

class ContactRepositoryImpl extends BaseRepository<Contact> {
  async getByOrganisation(organisationId: string): Promise<Contact[]> {
    return this.list({ organisationId });
  }
}

export const contactRepository = new ContactRepositoryImpl();