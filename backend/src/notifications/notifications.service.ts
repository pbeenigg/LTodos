import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from '../entities/notification.entity';
import { Task, TaskStatus } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(user: User): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string, user: User): Promise<void> {
    await this.notificationsRepository.update(
        { id, userId: user.id },
        { isRead: true }
    );
  }

  async markAllAsRead(user: User): Promise<void> {
      await this.notificationsRepository.update(
          { userId: user.id, isRead: false },
          { isRead: true }
      );
  }

  // Check for reminders every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();
    
    // Find tasks that are due for reminder and haven't been sent
    // And task is not done
    const tasks = await this.tasksRepository.find({
      where: {
        reminderTime: LessThanOrEqual(now),
        isReminderSent: false,
        // We might also want to check if status is not DONE?
        // Usually reminders are sent regardless, or maybe only if not done.
        // Let's assume if not done. But TypeORM complex query in find might be tricky without QueryBuilder.
        // Let's filter in memory or use QueryBuilder if performance matters later.
      },
      relations: ['assignee', 'creator']
    });

    for (const task of tasks) {
      if (task.status === TaskStatus.DONE) continue;

      // Determine who to notify: Assignee preferred, else Creator
      const targetUser = task.assignee || task.creator;
      if (!targetUser) continue;

      // Check preferences
      // Default to true if not set
      const webEnabled = targetUser.notificationPreferences?.web ?? true;
      
      if (!webEnabled) {
          // If web notifications disabled, maybe we still create DB record but don't push?
          // Or don't create at all? Usually "Notifications" implies the record list.
          // "Web" preference might mean "Push/Toast" vs "Email".
          // Let's assume we always create record, but only Push if enabled.
      }

      // Create notification
      const notification = await this.notificationsRepository.save({
        userId: targetUser.id,
        content: `Reminder: Task "${task.title}" is due soon!`,
        taskId: task.id,
      });
      
      if (webEnabled) {
          this.notificationsGateway.sendNotification(targetUser.id, notification);
      }

      // Mark as sent
      task.isReminderSent = true;
      await this.tasksRepository.save(task);
      
      console.log(`Sent reminder for task ${task.id} to user ${targetUser.email}`);
    }
  }
}
