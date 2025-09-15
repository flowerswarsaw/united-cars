import { 
  Lead, 
  Deal, 
  ConvertLeadInput, 
  LeadRepository as ILeadRepository,
  makeDeal,
  makeDealCurrentStage,
  makeDealStageHistory,
  makeActivity,
  DealStatus,
  ActivityType,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { activityRepository } from './activity-repository';
import { dealRepository } from './deal-repository';
import { pipelineRepository } from './pipeline-repository';

class LeadRepositoryImpl extends BaseRepository<Lead> implements ILeadRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.LEAD);
  }
  async convertToDeal(leadId: string, input: ConvertLeadInput): Promise<Deal> {
    const lead = await this.get(leadId);
    if (!lead) throw new Error('Lead not found');
    if (!lead.isTarget) throw new Error('Only target leads can be converted to deals');

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

    // Get first stage of the pipeline
    const pipeline = await pipelineRepository.getWithStages(pipelineId);
    if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
      throw new Error('Pipeline has no stages');
    }
    const firstStage = pipeline.stages[0];

    // Create the deal
    const deal = await dealRepository.create({
      title: input.title,
      amount: input.amount,
      currency: input.currency || 'USD',
      organisationId: lead.organisationId,
      contactId: lead.contactId,
      status: DealStatus.OPEN,
      notes: input.notes,
      assigneeId: input.assigneeId
    });

    // Set current stage
    const currentStage = makeDealCurrentStage(deal.id, pipelineId, firstStage.id);
    deal.currentStages = [currentStage];

    // Add stage history
    const history = makeDealStageHistory(deal.id, pipelineId, firstStage.id);
    deal.stageHistory = [history];

    // Update the deal with stages
    await dealRepository.update(deal.id, {
      currentStages: deal.currentStages,
      stageHistory: deal.stageHistory
    });

    // Log activities
    await activityRepository.log(
      makeActivity(
        EntityType.LEAD,
        leadId,
        ActivityType.LEAD_CONVERTED,
        `Lead converted to deal: ${deal.title}`,
        { dealId: deal.id }
      )
    );

    await activityRepository.log(
      makeActivity(
        EntityType.DEAL,
        deal.id,
        ActivityType.CREATED,
        `Deal created from lead conversion`,
        { leadId }
      )
    );

    return deal;
  }
}

export class LeadRepository extends LeadRepositoryImpl {}
export const leadRepository = new LeadRepositoryImpl();