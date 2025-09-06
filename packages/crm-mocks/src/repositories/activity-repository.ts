import { 
  Activity,
  ActivityRepository as IActivityRepository,
  EntityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

class ActivityRepositoryImpl extends BaseRepository<Activity> implements IActivityRepository<Activity> {
  async log(activity: Omit<Activity, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
    return this.create(activity);
  }

  async getByEntity(entityType: EntityType, entityId: string): Promise<Activity[]> {
    return this.list({ entityType, entityId });
  }
}

export const activityRepository = new ActivityRepositoryImpl();