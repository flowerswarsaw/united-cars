import {
  UserActivity,
  UserActivityRepository as IUserActivityRepository,
  EntityType,
  ActivityType
} from '@united-cars/crm-core';
import { nanoid } from 'nanoid';

/**
 * User Activity Repository
 * Manages user activity logs and audit trails
 */
export class UserActivityRepository implements IUserActivityRepository {
  private activities: Map<string, UserActivity> = new Map();
  private tenantId = 'tenant_001';

  // Activity logging
  async logActivity(
    activity: Omit<UserActivity, 'id' | 'timestamp'>
  ): Promise<UserActivity> {
    const newActivity: UserActivity = {
      ...activity,
      id: nanoid(),
      timestamp: new Date(),
      tenantId: activity.tenantId || this.tenantId
    };

    this.activities.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Activity queries
  async getUserActivities(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<UserActivity[]> {
    const allActivities = Array.from(this.activities.values());
    const userActivities = allActivities
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return userActivities.slice(offset, offset + limit);
  }

  async getEntityActivities(
    entityType: EntityType,
    entityId: string,
    limit = 50
  ): Promise<UserActivity[]> {
    const allActivities = Array.from(this.activities.values());
    const entityActivities = allActivities
      .filter(a => a.entityType === entityType && a.entityId === entityId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return entityActivities.slice(0, limit);
  }

  async getRecentActivities(limit = 50): Promise<UserActivity[]> {
    const allActivities = Array.from(this.activities.values());
    return allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Filtered queries
  async getActivitiesByAction(
    userId: string,
    action: ActivityType,
    limit = 50
  ): Promise<UserActivity[]> {
    const allActivities = Array.from(this.activities.values());
    return allActivities
      .filter(a => a.userId === userId && a.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getActivitiesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserActivity[]> {
    const allActivities = Array.from(this.activities.values());
    return allActivities
      .filter(a => {
        if (a.userId !== userId) return false;
        const timestamp = a.timestamp.getTime();
        return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Statistics
  async getActivityCount(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    if (!startDate && !endDate) {
      const allActivities = Array.from(this.activities.values());
      return allActivities.filter(a => a.userId === userId).length;
    }

    const activities = await this.getActivitiesByDateRange(
      userId,
      startDate || new Date(0),
      endDate || new Date()
    );
    return activities.length;
  }

  async getActivityBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const allActivities = Array.from(this.activities.values());
    let userActivities = allActivities.filter(a => a.userId === userId);

    if (startDate || endDate) {
      userActivities = userActivities.filter(a => {
        const timestamp = a.timestamp.getTime();
        const start = startDate?.getTime() || 0;
        const end = endDate?.getTime() || Date.now();
        return timestamp >= start && timestamp <= end;
      });
    }

    const breakdown: Record<string, number> = {};

    for (const activity of userActivities) {
      const key = `${activity.action}_${activity.entityType}`;
      breakdown[key] = (breakdown[key] || 0) + 1;
    }

    return breakdown;
  }

  // Initialize activities from seed data
  initializeActivities(activities: UserActivity[]): void {
    for (const activity of activities) {
      this.activities.set(activity.id, activity);
    }
  }

  // Clear all activities (for testing)
  clear(): void {
    this.activities.clear();
  }
}

// Export singleton instance
export const userActivityRepository = new UserActivityRepository();
