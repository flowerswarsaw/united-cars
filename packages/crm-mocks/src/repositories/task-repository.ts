import { 
  Task,
  TaskRepository as ITaskRepository,
  TaskStatus,
  EntityType,
  makeActivity,
  ActivityType
} from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';
import { activityRepository } from './activity-repository';

class TaskRepositoryImpl extends BaseRepository<Task> implements ITaskRepository<Task> {
  async getByTarget(targetType: EntityType, targetId: string): Promise<Task[]> {
    return this.list({ targetType, targetId });
  }

  async changeStatus(id: string, status: TaskStatus): Promise<Task | undefined> {
    const task = await this.get(id);
    if (!task) return undefined;

    const wasCompleted = task.status === TaskStatus.DONE;
    const isNowCompleted = status === TaskStatus.DONE;

    const updated = await this.update(id, {
      status,
      completedAt: isNowCompleted && !wasCompleted ? new Date() : task.completedAt
    });

    if (isNowCompleted && !wasCompleted) {
      await activityRepository.log(
        makeActivity(
          task.targetType,
          task.targetId,
          ActivityType.TASK_COMPLETED,
          `Task completed: ${task.title}`,
          { taskId: id }
        )
      );
    }

    return updated;
  }

  async changeAssignee(id: string, assigneeId: string | null): Promise<Task | undefined> {
    return this.update(id, { assigneeId: assigneeId || undefined });
  }
}

export const taskRepository = new TaskRepositoryImpl();