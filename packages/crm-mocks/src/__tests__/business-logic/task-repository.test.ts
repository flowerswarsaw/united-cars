import { describe, it, expect, beforeEach } from 'vitest';
import { taskRepository } from '../../repositories/task-repository';
import { activityRepository } from '../../repositories/activity-repository';
import { TaskStatus, TaskPriority, EntityType, ActivityType } from '@united-cars/crm-core';

describe('Task Repository Business Logic', () => {
  beforeEach(() => {
    taskRepository.clear();
    activityRepository.clear();
  });

  // Helper to create a test task
  const createTestTask = async (overrides: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    targetType: EntityType;
    targetId: string;
    assigneeId: string;
    dueDate: Date;
    completedAt: Date;
    tags: string[];
  }> = {}) => {
    const task = await taskRepository.create({
      title: overrides.title || `Test Task - ${Date.now()}`,
      description: overrides.description,
      status: overrides.status || TaskStatus.TODO,
      priority: overrides.priority || TaskPriority.MEDIUM,
      targetType: overrides.targetType || EntityType.DEAL,
      targetId: overrides.targetId || `deal-${Date.now()}`,
      assigneeId: overrides.assigneeId,
      dueDate: overrides.dueDate,
      completedAt: overrides.completedAt,
      tags: overrides.tags
    } as any);
    return task;
  };

  describe('Task Creation', () => {
    it('should create task with all required fields', async () => {
      const task = await createTestTask({
        title: 'Follow up with dealer',
        description: 'Discuss contract terms',
        priority: TaskPriority.HIGH,
        targetType: EntityType.ORGANISATION,
        targetId: 'org-123'
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Follow up with dealer');
      expect(task.description).toBe('Discuss contract terms');
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.targetType).toBe(EntityType.ORGANISATION);
      expect(task.targetId).toBe('org-123');
    });

    it('should create task with optional fields', async () => {
      const dueDate = new Date('2025-12-31');
      const task = await createTestTask({
        title: 'Year-end review',
        assigneeId: 'user-456',
        dueDate,
        tags: ['review', 'important']
      });

      expect(task.assigneeId).toBe('user-456');
      expect(new Date(task.dueDate!).toISOString()).toBe(dueDate.toISOString());
      expect(task.tags).toEqual(['review', 'important']);
    });

    it('should create task with default TODO status', async () => {
      const task = await createTestTask();
      expect(task.status).toBe(TaskStatus.TODO);
    });
  });

  describe('getByTarget', () => {
    it('should return tasks for a specific target', async () => {
      const dealId = 'deal-target-123';

      // Create tasks for different targets
      await createTestTask({ targetType: EntityType.DEAL, targetId: dealId, title: 'Task 1' });
      await createTestTask({ targetType: EntityType.DEAL, targetId: dealId, title: 'Task 2' });
      await createTestTask({ targetType: EntityType.DEAL, targetId: 'other-deal', title: 'Task 3' });
      await createTestTask({ targetType: EntityType.ORGANISATION, targetId: 'org-123', title: 'Task 4' });

      const dealTasks = await taskRepository.getByTarget(EntityType.DEAL, dealId);

      expect(dealTasks).toHaveLength(2);
      expect(dealTasks.every(t => t.targetId === dealId)).toBe(true);
      expect(dealTasks.every(t => t.targetType === EntityType.DEAL)).toBe(true);
    });

    it('should return empty array when no tasks for target', async () => {
      await createTestTask({ targetType: EntityType.DEAL, targetId: 'deal-123' });

      const tasks = await taskRepository.getByTarget(EntityType.CONTACT, 'contact-nonexistent');

      expect(tasks).toEqual([]);
    });

    it('should differentiate between entity types with same ID', async () => {
      const sharedId = 'entity-shared-id';

      await createTestTask({ targetType: EntityType.DEAL, targetId: sharedId, title: 'Deal Task' });
      await createTestTask({ targetType: EntityType.LEAD, targetId: sharedId, title: 'Lead Task' });

      const dealTasks = await taskRepository.getByTarget(EntityType.DEAL, sharedId);
      const leadTasks = await taskRepository.getByTarget(EntityType.LEAD, sharedId);

      expect(dealTasks).toHaveLength(1);
      expect(dealTasks[0].title).toBe('Deal Task');
      expect(leadTasks).toHaveLength(1);
      expect(leadTasks[0].title).toBe('Lead Task');
    });
  });

  describe('changeStatus', () => {
    it('should change task status from TODO to IN_PROGRESS', async () => {
      const task = await createTestTask({ status: TaskStatus.TODO });

      const updated = await taskRepository.changeStatus(task.id, TaskStatus.IN_PROGRESS);

      expect(updated).toBeDefined();
      expect(updated!.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updated!.completedAt).toBeUndefined();
    });

    it('should set completedAt when status changes to DONE', async () => {
      const task = await createTestTask({ status: TaskStatus.IN_PROGRESS });

      const updated = await taskRepository.changeStatus(task.id, TaskStatus.DONE);

      expect(updated).toBeDefined();
      expect(updated!.status).toBe(TaskStatus.DONE);
      expect(updated!.completedAt).toBeDefined();
    });

    it('should log activity when task is completed', async () => {
      const targetId = 'deal-activity-test';
      const task = await createTestTask({
        targetType: EntityType.DEAL,
        targetId,
        title: 'Complete this task'
      });

      await taskRepository.changeStatus(task.id, TaskStatus.DONE);

      const activities = await activityRepository.getByEntity(EntityType.DEAL, targetId);
      const completionActivity = activities.find(a => a.type === ActivityType.TASK_COMPLETED);

      expect(completionActivity).toBeDefined();
      expect(completionActivity!.description).toContain('Complete this task');
      expect(completionActivity!.meta?.taskId).toBe(task.id);
    });

    it('should not log activity when changing to non-DONE status', async () => {
      const targetId = 'deal-no-activity';
      const task = await createTestTask({
        targetType: EntityType.DEAL,
        targetId
      });

      await taskRepository.changeStatus(task.id, TaskStatus.IN_PROGRESS);

      const activities = await activityRepository.getByEntity(EntityType.DEAL, targetId);
      const completionActivity = activities.find(a => a.type === ActivityType.TASK_COMPLETED);

      expect(completionActivity).toBeUndefined();
    });

    it('should not update completedAt if already completed', async () => {
      const originalCompletedAt = new Date('2025-01-01');
      const task = await createTestTask({
        status: TaskStatus.DONE,
        completedAt: originalCompletedAt
      });

      // Clear activities from initial creation
      activityRepository.clear();

      // Change from DONE to DONE (no real change)
      const updated = await taskRepository.changeStatus(task.id, TaskStatus.DONE);

      // completedAt should remain the original
      expect(new Date(updated!.completedAt!).toISOString()).toBe(originalCompletedAt.toISOString());

      // No new activity should be logged
      const activities = await activityRepository.list();
      expect(activities.filter(a => a.type === ActivityType.TASK_COMPLETED)).toHaveLength(0);
    });

    it('should return undefined for non-existent task', async () => {
      const result = await taskRepository.changeStatus('nonexistent-id', TaskStatus.DONE);
      expect(result).toBeUndefined();
    });

    it('should allow changing from DONE back to IN_PROGRESS', async () => {
      const task = await createTestTask({ status: TaskStatus.TODO });

      // Complete the task
      let updated = await taskRepository.changeStatus(task.id, TaskStatus.DONE);
      expect(updated!.status).toBe(TaskStatus.DONE);
      expect(updated!.completedAt).toBeDefined();

      // Reopen the task
      updated = await taskRepository.changeStatus(task.id, TaskStatus.IN_PROGRESS);
      expect(updated!.status).toBe(TaskStatus.IN_PROGRESS);
      // completedAt should be preserved from previous completion
      expect(updated!.completedAt).toBeDefined();
    });

    it('should allow cancelling a task', async () => {
      const task = await createTestTask({ status: TaskStatus.IN_PROGRESS });

      const updated = await taskRepository.changeStatus(task.id, TaskStatus.CANCELLED);

      expect(updated!.status).toBe(TaskStatus.CANCELLED);
    });
  });

  describe('changeAssignee', () => {
    it('should assign task to a user', async () => {
      const task = await createTestTask();

      const updated = await taskRepository.changeAssignee(task.id, 'user-new-123');

      expect(updated).toBeDefined();
      expect(updated!.assigneeId).toBe('user-new-123');
    });

    it('should change task assignee', async () => {
      const task = await createTestTask({ assigneeId: 'user-original' });

      const updated = await taskRepository.changeAssignee(task.id, 'user-replacement');

      expect(updated!.assigneeId).toBe('user-replacement');
    });

    it('should unassign task when assigneeId is null', async () => {
      const task = await createTestTask({ assigneeId: 'user-123' });

      const updated = await taskRepository.changeAssignee(task.id, null);

      expect(updated).toBeDefined();
      expect(updated!.assigneeId).toBeUndefined();
    });

    it('should return undefined for non-existent task', async () => {
      const result = await taskRepository.changeAssignee('nonexistent-id', 'user-123');
      expect(result).toBeUndefined();
    });
  });

  describe('Task Priority', () => {
    it('should create tasks with different priorities', async () => {
      const lowTask = await createTestTask({ priority: TaskPriority.LOW });
      const mediumTask = await createTestTask({ priority: TaskPriority.MEDIUM });
      const highTask = await createTestTask({ priority: TaskPriority.HIGH });
      const urgentTask = await createTestTask({ priority: TaskPriority.URGENT });

      expect(lowTask.priority).toBe(TaskPriority.LOW);
      expect(mediumTask.priority).toBe(TaskPriority.MEDIUM);
      expect(highTask.priority).toBe(TaskPriority.HIGH);
      expect(urgentTask.priority).toBe(TaskPriority.URGENT);
    });

    it('should be able to update task priority', async () => {
      const task = await createTestTask({ priority: TaskPriority.LOW });

      const updated = await taskRepository.update(task.id, { priority: TaskPriority.URGENT });

      expect(updated.priority).toBe(TaskPriority.URGENT);
    });
  });

  describe('Task Target Types', () => {
    it('should support all entity types as targets', async () => {
      const entityTypes = [
        EntityType.DEAL,
        EntityType.LEAD,
        EntityType.CONTACT,
        EntityType.ORGANISATION,
        EntityType.CONTRACT
      ];

      for (const targetType of entityTypes) {
        const task = await createTestTask({
          targetType,
          targetId: `${targetType.toLowerCase()}-123`
        });
        expect(task.targetType).toBe(targetType);
      }
    });

    it('should retrieve tasks by different target types', async () => {
      await createTestTask({ targetType: EntityType.DEAL, targetId: 'deal-1' });
      await createTestTask({ targetType: EntityType.LEAD, targetId: 'lead-1' });
      await createTestTask({ targetType: EntityType.CONTACT, targetId: 'contact-1' });

      const dealTasks = await taskRepository.getByTarget(EntityType.DEAL, 'deal-1');
      const leadTasks = await taskRepository.getByTarget(EntityType.LEAD, 'lead-1');
      const contactTasks = await taskRepository.getByTarget(EntityType.CONTACT, 'contact-1');

      expect(dealTasks).toHaveLength(1);
      expect(leadTasks).toHaveLength(1);
      expect(contactTasks).toHaveLength(1);
    });
  });

  describe('Task Due Dates', () => {
    it('should create task with due date', async () => {
      const dueDate = new Date('2025-12-15');
      const task = await createTestTask({ dueDate });

      expect(task.dueDate).toBeDefined();
      expect(new Date(task.dueDate!).toDateString()).toBe(dueDate.toDateString());
    });

    it('should update task due date', async () => {
      const task = await createTestTask();
      const newDueDate = new Date('2025-06-30');

      const updated = await taskRepository.update(task.id, { dueDate: newDueDate });

      expect(new Date(updated.dueDate!).toDateString()).toBe(newDueDate.toDateString());
    });

    it('should allow removing due date', async () => {
      const task = await createTestTask({ dueDate: new Date() });

      const updated = await taskRepository.update(task.id, { dueDate: undefined });

      expect(updated.dueDate).toBeUndefined();
    });
  });

  describe('Task Workflow Transitions', () => {
    it('should support full task lifecycle: TODO -> IN_PROGRESS -> DONE', async () => {
      const task = await createTestTask({ status: TaskStatus.TODO });

      // Start work
      let updated = await taskRepository.changeStatus(task.id, TaskStatus.IN_PROGRESS);
      expect(updated!.status).toBe(TaskStatus.IN_PROGRESS);

      // Complete work
      updated = await taskRepository.changeStatus(task.id, TaskStatus.DONE);
      expect(updated!.status).toBe(TaskStatus.DONE);
      expect(updated!.completedAt).toBeDefined();
    });

    it('should support cancellation from any status', async () => {
      const todoTask = await createTestTask({ status: TaskStatus.TODO });
      const inProgressTask = await createTestTask({ status: TaskStatus.IN_PROGRESS });
      const doneTask = await createTestTask({ status: TaskStatus.DONE });

      const cancelledTodo = await taskRepository.changeStatus(todoTask.id, TaskStatus.CANCELLED);
      const cancelledInProgress = await taskRepository.changeStatus(inProgressTask.id, TaskStatus.CANCELLED);
      const cancelledDone = await taskRepository.changeStatus(doneTask.id, TaskStatus.CANCELLED);

      expect(cancelledTodo!.status).toBe(TaskStatus.CANCELLED);
      expect(cancelledInProgress!.status).toBe(TaskStatus.CANCELLED);
      expect(cancelledDone!.status).toBe(TaskStatus.CANCELLED);
    });
  });

  describe('Task Tags', () => {
    it('should create task with tags', async () => {
      const task = await createTestTask({ tags: ['urgent', 'follow-up', 'client'] });

      expect(task.tags).toEqual(['urgent', 'follow-up', 'client']);
    });

    it('should update task tags', async () => {
      const task = await createTestTask({ tags: ['initial'] });

      const updated = await taskRepository.update(task.id, { tags: ['updated', 'new-tag'] });

      expect(updated.tags).toEqual(['updated', 'new-tag']);
    });

    it('should allow empty tags array', async () => {
      const task = await createTestTask({ tags: [] });

      expect(task.tags).toEqual([]);
    });
  });
});
