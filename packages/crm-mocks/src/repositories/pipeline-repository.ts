import { 
  Pipeline,
  Stage,
  OrganizationType,
  PipelineRepository as IPipelineRepository,
  makeStage,
  isPipelineApplicableToType,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { nanoid } from 'nanoid';

class PipelineRepositoryImpl extends BaseRepository<Pipeline> implements IPipelineRepository {
  constructor() {
    super();
    this.setEntityType(EntityType.PIPELINE);
  }
  
  private stages: Map<string, Stage> = new Map();

  async createStage(pipelineId: string, stageData: Omit<Stage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'pipelineId'>): Promise<Stage> {
    const pipeline = await this.get(pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const existingStages = await this.getStages(pipelineId);
    const maxOrder = Math.max(0, ...existingStages.map(s => s.order));

    const stage = makeStage(pipelineId, {
      ...stageData,
      order: stageData.order ?? maxOrder + 1
    });

    this.stages.set(stage.id, stage);
    return stage;
  }

  async updateStage(stageId: string, data: Partial<Omit<Stage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'pipelineId'>>): Promise<Stage | undefined> {
    const stage = this.stages.get(stageId);
    if (!stage) return undefined;

    const updated = {
      ...stage,
      ...data,
      updatedAt: new Date()
    };

    this.stages.set(stageId, updated);
    return updated;
  }

  async deleteStage(stageId: string): Promise<boolean> {
    // Check if any deals are in this stage
    const { dealRepository } = await import('./deal-repository');
    const stage = this.stages.get(stageId);
    if (!stage) return false;

    const deals = await dealRepository.getByPipelineAndStage(stage.pipelineId, stageId);
    if (deals.length > 0) {
      throw new Error('Cannot delete stage with active deals');
    }

    return this.stages.delete(stageId);
  }

  async reorderStages(pipelineId: string, stageIds: string[]): Promise<boolean> {
    const stages = await this.getStages(pipelineId);
    
    // Verify all stages belong to this pipeline
    const pipelineStageIds = new Set(stages.map(s => s.id));
    if (!stageIds.every(id => pipelineStageIds.has(id))) {
      throw new Error('Invalid stage IDs for pipeline');
    }

    // Update orders
    stageIds.forEach((stageId, index) => {
      const stage = this.stages.get(stageId);
      if (stage) {
        this.stages.set(stageId, {
          ...stage,
          order: index,
          updatedAt: new Date()
        });
      }
    });

    return true;
  }

  async getWithStages(id: string): Promise<Pipeline | undefined> {
    const pipeline = await this.get(id);
    if (!pipeline) return undefined;

    const stages = await this.getStages(id);
    return {
      ...pipeline,
      stages: stages.sort((a, b) => a.order - b.order)
    };
  }

  async getStages(pipelineId: string): Promise<Stage[]> {
    return Array.from(this.stages.values())
      .filter(stage => stage.pipelineId === pipelineId)
      .sort((a, b) => a.order - b.order);
  }

  seedStages(stages: Stage[]): void {
    stages.forEach(stage => {
      this.stages.set(stage.id, stage);
    });
  }

  clearStages(): void {
    this.stages.clear();
  }

  stagesToJSON(): Stage[] {
    return Array.from(this.stages.values());
  }

  stagesFromJSON(data: Stage[]): void {
    this.stages.clear();
    data.forEach(stage => {
      if (typeof stage.createdAt === 'string') {
        stage.createdAt = new Date(stage.createdAt);
      }
      if (typeof stage.updatedAt === 'string') {
        stage.updatedAt = new Date(stage.updatedAt);
      }
      this.stages.set(stage.id, stage);
    });
  }

  // Organization type-specific pipeline methods
  async getPipelinesForOrganizationType(orgType: OrganizationType): Promise<Pipeline[]> {
    const allPipelines = await this.list();
    return allPipelines.filter(pipeline => 
      pipeline.applicableTypes.includes(orgType)
    );
  }

  async getApplicablePipelinesForDeal(organisationId: string): Promise<Pipeline[]> {
    // Get organisation type from organisation repository
    const { organisationRepository } = await import('./organisation-repository');
    
    try {
      const org = await organisationRepository.get(organisationId);
      if (!org) return [];
      
      return await this.getPipelinesForOrganizationType(org.type);
    } catch (error) {
      console.error('Error fetching applicable pipelines:', error);
      return [];
    }
  }

  async validatePipelineForOrganisation(pipelineId: string, organisationId: string): Promise<boolean> {
    const pipeline = await this.get(pipelineId);
    if (!pipeline) return false;

    const { organisationRepository } = await import('./organisation-repository');
    
    try {
      const org = await organisationRepository.get(organisationId);
      if (!org) return false;
      
      return pipeline.applicableTypes.includes(org.type);
    } catch (error) {
      console.error('Error validating pipeline for organisation:', error);
      return false;
    }
  }

  async getDefaultPipelineForType(orgType: OrganizationType): Promise<Pipeline | undefined> {
    const pipelines = await this.getPipelinesForOrganizationType(orgType);
    return pipelines.find(p => p.isDefault) || pipelines[0];
  }

  async updatePipelineApplicableTypes(pipelineId: string, applicableTypes: OrganizationType[]): Promise<Pipeline | null> {
    return (await this.update(pipelineId, { 
      applicableTypes,
      isTypeSpecific: applicableTypes.length > 0 && applicableTypes.length < Object.keys(OrganizationType).length
    })) || null;
  }

  async searchPipelines(query: {
    name?: string;
    applicableTypes?: OrganizationType[];
    isDefault?: boolean;
    isTypeSpecific?: boolean;
  }): Promise<Pipeline[]> {
    const allPipelines = await this.list();
    
    return allPipelines.filter(pipeline => {
      if (query.name && !pipeline.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }
      
      if (query.applicableTypes && query.applicableTypes.length > 0) {
        const hasMatchingType = query.applicableTypes.some(type => 
          pipeline.applicableTypes.includes(type)
        );
        if (!hasMatchingType) return false;
      }
      
      if (query.isDefault !== undefined && pipeline.isDefault !== query.isDefault) {
        return false;
      }
      
      if (query.isTypeSpecific !== undefined && pipeline.isTypeSpecific !== query.isTypeSpecific) {
        return false;
      }
      
      return true;
    });
  }

  async clonePipelineForType(sourcePipelineId: string, newName: string, targetType: OrganizationType): Promise<Pipeline | null> {
    const sourcePipeline = await this.getWithStages(sourcePipelineId);
    if (!sourcePipeline) return null;

    // Create new pipeline
    const newPipeline = await this.create({
      name: newName,
      description: `Cloned from ${sourcePipeline.name} for ${targetType}`,
      isDefault: false,
      order: await this.getNextOrder(),
      color: sourcePipeline.color,
      applicableTypes: [targetType],
      isTypeSpecific: true
    });

    // Clone stages
    if (sourcePipeline.stages) {
      for (const stage of sourcePipeline.stages) {
        await this.createStage(newPipeline.id, {
          name: stage.name,
          order: stage.order,
          color: stage.color,
          wipLimit: stage.wipLimit,
          slaTarget: stage.slaTarget,
          isClosing: stage.isClosing,
          isLost: stage.isLost
        });
      }
    }

    return (await this.getWithStages(newPipeline.id)) || null;
  }

  private async getNextOrder(): Promise<number> {
    const pipelines = await this.list();
    return Math.max(0, ...pipelines.map(p => p.order)) + 1;
  }

  async getPipelineMetrics(pipelineId: string): Promise<{
    totalStages: number;
    avgDealsPerStage: number;
    conversionRates: Record<string, number>;
    applicableTypes: OrganizationType[];
  } | null> {
    const pipeline = await this.getWithStages(pipelineId);
    if (!pipeline || !pipeline.stages) return null;

    // This would normally calculate actual metrics from deals
    const mockMetrics = {
      totalStages: pipeline.stages.length,
      avgDealsPerStage: Math.floor(Math.random() * 20) + 5, // Mock data
      conversionRates: {} as Record<string, number>,
      applicableTypes: pipeline.applicableTypes
    };

    // Calculate mock conversion rates between stages
    pipeline.stages.forEach((stage, index) => {
      if (index < pipeline.stages!.length - 1) {
        mockMetrics.conversionRates[`${stage.name}_to_${pipeline.stages![index + 1].name}`] = 
          Math.random() * 0.4 + 0.3; // 30-70% conversion rate
      }
    });

    return mockMetrics;
  }
}

export class PipelineRepository extends PipelineRepositoryImpl {}
export const pipelineRepository = new PipelineRepositoryImpl();