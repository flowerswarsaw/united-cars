import { 
  ChangeLog,
  ChangeLogRepository as IChangeLogRepository,
  EntityType,
  ActivityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

class ChangeLogRepositoryImpl extends BaseRepository<ChangeLog> implements IChangeLogRepository {
  async logChange(changeLog: Omit<ChangeLog, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ChangeLog> {
    return this.create(changeLog, changeLog.userId);
  }

  async getChangesForEntity(entityType: EntityType, entityId: string, limit?: number): Promise<ChangeLog[]> {
    const allChanges = await this.list({ entityType, entityId });
    
    // Sort by creation date (newest first)
    const sorted = allChanges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getChangesByUser(userId: string, limit?: number): Promise<ChangeLog[]> {
    const allChanges = await this.list({ userId });
    
    // Sort by creation date (newest first)
    const sorted = allChanges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getRecentChanges(limit: number = 50): Promise<ChangeLog[]> {
    const allChanges = await this.list();
    
    // Sort by creation date (newest first)
    const sorted = allChanges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return sorted.slice(0, limit);
  }
}

export const changeLogRepository = new ChangeLogRepositoryImpl();