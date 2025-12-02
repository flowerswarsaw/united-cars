import {
  Lead,
  Deal,
  Contact,
  ConvertLeadInput,
  LeadRepository as ILeadRepository,
  makeDeal,
  makeDealCurrentStage,
  makeDealStageHistory,
  makeActivity,
  makeContact,
  DealStatus,
  ActivityType,
  EntityType,
  ContactType,
  ContactMethodType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { activityRepository } from './activity-repository';
import { contactRepository } from './contact-repository';
import { organisationRepository } from './organisation-repository';
import { pipelineRepository } from './pipeline-repository';
import { dealRepository } from './deal-repository';

class LeadRepositoryImpl extends BaseRepository<Lead> implements ILeadRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.LEAD);
  }

  async findDuplicates(email?: string, phone?: string): Promise<{ leads: Lead[], contacts: Contact[] }> {
    const duplicates = { leads: [] as Lead[], contacts: [] as Contact[] };

    if (email) {
      // Check existing leads
      const existingLeads = await this.list();
      duplicates.leads = existingLeads.filter(lead =>
        lead.email && lead.email.toLowerCase() === email.toLowerCase()
      );

      // Check existing contacts
      const allContacts = await contactRepository.list();
      duplicates.contacts = allContacts.filter(contact =>
        contact.contactMethods?.some(method =>
          method.type === ContactMethodType.EMAIL &&
          method.value.toLowerCase() === email.toLowerCase()
        )
      );
    }

    if (phone) {
      // Check existing leads for phone
      const existingLeads = await this.list();
      const phoneLeads = existingLeads.filter(lead =>
        lead.phone && lead.phone === phone
      );
      duplicates.leads = [...duplicates.leads, ...phoneLeads].filter((lead, index, self) =>
        self.findIndex(l => l.id === lead.id) === index
      );

      // Check existing contacts for phone
      const allContacts = await contactRepository.list();
      const phoneContacts = allContacts.filter(contact =>
        contact.contactMethods?.some(method =>
          method.type === ContactMethodType.PHONE &&
          method.value === phone
        )
      );
      duplicates.contacts = [...duplicates.contacts, ...phoneContacts].filter((contact, index, self) =>
        self.findIndex(c => c.id === contact.id) === index
      );
    }

    return duplicates;
  }

  async archive(leadId: string, reason: 'converted' | 'not_qualified' | 'duplicate' | 'invalid', userId?: string): Promise<Lead> {
    const lead = await this.get(leadId);
    if (!lead) throw new Error('Lead not found');
    if (lead.isArchived) throw new Error('Lead is already archived');

    const updated = await this.update(leadId, {
      isArchived: true,
      archivedAt: new Date(),
      archivedReason: reason,
      archivedBy: userId
    });

    // Log activity
    await activityRepository.log(
      makeActivity(
        EntityType.LEAD,
        leadId,
        ActivityType.ARCHIVED,
        `Lead archived: ${reason}`,
        { reason, archivedBy: userId }
      )
    );

    return updated;
  }

  async restore(leadId: string, userId?: string): Promise<Lead> {
    const lead = await this.get(leadId);
    if (!lead) throw new Error('Lead not found');
    if (!lead.isArchived) throw new Error('Lead is not archived');

    const updated = await this.update(leadId, {
      isArchived: false,
      archivedAt: undefined,
      archivedReason: undefined,
      archivedBy: undefined
    });

    // Log activity
    await activityRepository.log(
      makeActivity(
        EntityType.LEAD,
        leadId,
        ActivityType.RESTORED,
        'Lead restored from archive',
        { restoredBy: userId }
      )
    );

    return updated;
  }

  async convertToDeal(leadId: string, input: ConvertLeadInput): Promise<Deal> {
    const lead = await this.get(leadId);
    if (!lead) throw new Error('Lead not found');

    // B3 Fix: Prevent double conversion - check this first since conversion archives the lead
    if (lead.convertedDealId) {
      throw new Error('Lead has already been converted to a deal');
    }

    if (!lead.isTarget) throw new Error('Only target leads can be converted to deals');
    if (lead.isArchived) throw new Error('Cannot convert archived lead');

    let contactId = lead.contactId;
    let organisationId = lead.organisationId;

    // Create contact if lead doesn't have one
    if (!contactId && (lead.firstName || lead.lastName)) {
      // B9 Fix: Check for existing contact with same email/phone before creating
      if (lead.email || lead.phone) {
        const allContacts = await contactRepository.list();
        const existingContact = allContacts.find(contact => {
          if (lead.email && contact.contactMethods?.some(m =>
            m.type === ContactMethodType.EMAIL &&
            m.value.toLowerCase() === lead.email!.toLowerCase()
          )) {
            return true;
          }
          if (lead.phone && contact.contactMethods?.some(m =>
            m.type === ContactMethodType.PHONE &&
            m.value === lead.phone
          )) {
            return true;
          }
          return false;
        });

        if (existingContact) {
          // Use existing contact instead of creating duplicate
          contactId = existingContact.id;
          // Update lead with existing contact reference
          await this.update(leadId, { contactId: existingContact.id });
        }
      }

      // Only create new contact if no existing one was found
      if (!contactId) {
        const contactMethods = [];

        if (lead.email) {
          contactMethods.push({
            id: `email-${Date.now()}`,
            type: ContactMethodType.EMAIL,
            value: lead.email,
            isPrimary: true
          });
        }

        if (lead.phone) {
          contactMethods.push({
            id: `phone-${Date.now()}`,
            type: ContactMethodType.PHONE,
            value: lead.phone,
            isPrimary: !lead.email
          });
        }

        const contact = await contactRepository.create({
          firstName: lead.firstName || 'Unknown',
          lastName: lead.lastName || '',
          type: ContactType.SALES,
          // B10 Fix: Assign organisation from lead if available
          organisationId: organisationId,
          contactMethods: contactMethods,
          notes: `Created from lead conversion: ${lead.title}`
        });

        contactId = contact.id;

        // Log contact creation
        await activityRepository.log(
          makeActivity(
            EntityType.CONTACT,
            contact.id,
            ActivityType.CREATED,
            `Contact created from lead conversion`,
            { leadId, leadTitle: lead.title }
          )
        );
      }
    }

    // Note: We don't create organizations from leads anymore.
    // Leads are individual people, and organization assignment happens later.

    // Get default pipeline or use provided one
    let pipelineId = input.pipelineId;
    if (!pipelineId) {
      const pipelines = await pipelineRepository.list({ isDefault: true });
      if (pipelines.length === 0) {
        const allPipelines = await pipelineRepository.list();
        const dealerPipeline = allPipelines.find(p => p.name === 'Dealer');
        pipelineId = dealerPipeline?.id || allPipelines[0]?.id;
      } else {
        pipelineId = pipelines[0].id;
      }
    }

    if (!pipelineId) throw new Error('No pipeline available');

    // Get stage or use first stage
    const pipeline = await pipelineRepository.getWithStages(pipelineId);
    if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
      throw new Error('Pipeline has no stages');
    }

    const stageId = input.stageId || pipeline.stages[0].id;
    const stage = pipeline.stages.find(s => s.id === stageId) || pipeline.stages[0];

    // Create the deal
    // B1 Fix: Use organisation from lead if available
    const deal = await dealRepository.create({
      title: input.title || lead.title,
      amount: input.amount,
      currency: input.currency || 'USD',
      organisationId: organisationId,
      contactId: contactId,
      status: DealStatus.OPEN,
      notes: input.notes || lead.notes,
      assigneeId: input.assigneeId
    });

    // Set current stage
    const currentStage = makeDealCurrentStage(deal.id, pipelineId, stage.id);
    deal.currentStages = [currentStage];

    // Add stage history
    const history = makeDealStageHistory(deal.id, pipelineId, stage.id);
    deal.stageHistory = [history];

    // Update the deal with stages
    await dealRepository.update(deal.id, {
      currentStages: deal.currentStages,
      stageHistory: deal.stageHistory
    });

    // Update lead with converted deal ID and archive it
    await this.update(leadId, {
      convertedDealId: deal.id,
      contactId: contactId
    });

    // Archive the lead
    await this.archive(leadId, 'converted', input.assigneeId);

    // Log activities
    await activityRepository.log(
      makeActivity(
        EntityType.LEAD,
        leadId,
        ActivityType.LEAD_CONVERTED,
        `Lead converted to deal: ${deal.title}`,
        { dealId: deal.id, contactId }
      )
    );

    await activityRepository.log(
      makeActivity(
        EntityType.DEAL,
        deal.id,
        ActivityType.CREATED,
        `Deal created from lead conversion`,
        { leadId, leadTitle: lead.title }
      )
    );

    return deal;
  }
}

export class LeadRepository extends LeadRepositoryImpl {}
export const leadRepository = new LeadRepositoryImpl();