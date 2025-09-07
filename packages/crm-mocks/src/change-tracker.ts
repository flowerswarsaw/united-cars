import { 
  ChangeLog, 
  EntityType, 
  ActivityType, 
  FieldChange,
  makeChangeLog,
  Deal
} from '@united-cars/crm-core';
import { changeLogRepository } from './repositories/change-log-repository';

export class ChangeTracker {
  private static formatFieldValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value.constructor === Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private static getEntityDisplayName(entity: any, entityType: EntityType): string {
    switch (entityType) {
      case EntityType.DEAL:
        return entity.title || 'Untitled Deal';
      case EntityType.ORGANISATION:
        return entity.name || 'Untitled Organization';
      case EntityType.CONTACT:
        return `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || 'Untitled Contact';
      case EntityType.LEAD:
        return entity.title || 'Untitled Lead';
      case EntityType.TASK:
        return entity.title || 'Untitled Task';
      default:
        return entity.name || entity.title || 'Untitled Item';
    }
  }

  private static getFieldDisplayName(field: string): string {
    const fieldMap: Record<string, string> = {
      title: 'Title',
      amount: 'Amount',
      currency: 'Currency',
      probability: 'Probability',
      status: 'Status',
      notes: 'Notes',
      organisationId: 'Organization',
      contactId: 'Contact',
      responsibleUserId: 'Responsible User',
      closeDate: 'Close Date',
      lossReason: 'Loss Reason'
    };
    return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
  }

  private static detectChanges(oldData: any, newData: any, ignoredFields: string[] = []): FieldChange[] {
    const changes: FieldChange[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    // Always ignore these fields
    const defaultIgnored = ['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
    const fieldsToIgnore = [...defaultIgnored, ...ignoredFields];

    for (const key of allKeys) {
      if (fieldsToIgnore.includes(key)) continue;
      
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];
      
      // Handle deep comparison for objects/arrays
      const oldStr = JSON.stringify(oldValue);
      const newStr = JSON.stringify(newValue);
      
      if (oldStr !== newStr) {
        changes.push({
          field: key,
          oldValue,
          newValue,
          displayOldValue: this.formatFieldValue(oldValue),
          displayNewValue: this.formatFieldValue(newValue)
        });
      }
    }

    return changes;
  }

  static async trackEntityChange(
    entityType: EntityType,
    entityId: string,
    oldEntity: any | null,
    newEntity: any,
    userId: string,
    action: ActivityType,
    customSummary?: string,
    userInfo?: { userName?: string; userEmail?: string; ipAddress?: string; userAgent?: string }
  ): Promise<ChangeLog | null> {
    const changes = oldEntity ? this.detectChanges(oldEntity, newEntity) : [];
    
    // If this is an update but no changes detected, don't log
    if (action === ActivityType.UPDATED && changes.length === 0) {
      return null;
    }

    let summary = customSummary;
    if (!summary) {
      const entityName = this.getEntityDisplayName(newEntity, entityType);
      
      switch (action) {
        case ActivityType.CREATED:
          summary = `${entityType.toLowerCase().replace('_', ' ')} "${entityName}" was created`;
          break;
        case ActivityType.UPDATED:
          if (changes.length === 1) {
            const change = changes[0];
            const fieldName = this.getFieldDisplayName(change.field);
            summary = `${fieldName} changed from "${change.displayOldValue}" to "${change.displayNewValue}"`;
          } else {
            summary = `${changes.length} fields updated: ${changes.map(c => this.getFieldDisplayName(c.field)).join(', ')}`;
          }
          break;
        case ActivityType.DELETED:
          summary = `${entityType.toLowerCase().replace('_', ' ')} "${entityName}" was deleted`;
          break;
        case ActivityType.STAGE_MOVED:
          summary = `${entityName} moved between stages`;
          break;
        case ActivityType.STATUS_CHANGED:
          const statusChange = changes.find(c => c.field === 'status');
          if (statusChange) {
            summary = `Status changed from ${statusChange.displayOldValue} to ${statusChange.displayNewValue}`;
          } else {
            summary = `Status changed`;
          }
          break;
        case ActivityType.AMOUNT_CHANGED:
          const amountChange = changes.find(c => c.field === 'amount');
          if (amountChange) {
            summary = `Amount changed from ${amountChange.displayOldValue} to ${amountChange.displayNewValue}`;
          } else {
            summary = `Amount changed`;
          }
          break;
        default:
          summary = `${entityType.toLowerCase().replace('_', ' ')} "${entityName}" was modified`;
      }
    }

    const changeLog = makeChangeLog(
      entityType,
      entityId,
      action,
      summary,
      changes,
      userId,
      userInfo
    );

    return await changeLogRepository.logChange(changeLog);
  }

  // Backward compatibility method for deals
  static async trackDealChange(
    dealId: string,
    oldDeal: Deal | null,
    newDeal: Deal,
    userId: string,
    action: ActivityType,
    customSummary?: string,
    userInfo?: { userName?: string; userEmail?: string; ipAddress?: string; userAgent?: string }
  ): Promise<ChangeLog | null> {
    return this.trackEntityChange(EntityType.DEAL, dealId, oldDeal, newDeal, userId, action, customSummary, userInfo);
  }

  static async getEntityChangeHistory(entityType: EntityType, entityId: string, limit?: number): Promise<ChangeLog[]> {
    return await changeLogRepository.getChangesForEntity(entityType, entityId, limit);
  }

  static async getUserChangeHistory(userId: string, limit?: number): Promise<ChangeLog[]> {
    return await changeLogRepository.getChangesByUser(userId, limit);
  }

  static async getRecentChanges(limit?: number): Promise<ChangeLog[]> {
    return await changeLogRepository.getRecentChanges(limit);
  }
}