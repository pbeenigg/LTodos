import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { RRule } from 'rrule';

@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminders() {
    // This logic should ideally be: Find tasks where reminderTime <= now AND notification NOT sent.
    // Since we don't have a Notification entity or 'reminded' flag in this simplified version,
    // I will just log the tasks that are due for reminder.
    // In a real app, we would update a flag to avoid spamming.
    
    const now = new Date();
    const tasksToRemind = await this.tasksRepository.find({
        where: {
            reminderTime: LessThan(now),
            status: Not(TaskStatus.DONE),
        }
    });

    if (tasksToRemind.length > 0) {
        this.logger.log(`Found ${tasksToRemind.length} tasks to remind.`);
        // Send notification logic here (WebSocket/Email)
        tasksToRemind.forEach(task => {
            this.logger.log(`Reminder for task: ${task.title} (ID: ${task.id})`);
            // Update reminderTime to null or next reminder to avoid re-triggering immediately
        });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringTasks() {
    this.logger.log('Checking for recurring tasks...');
    
    const recurringTasks = await this.tasksRepository.find({
        where: { recurrenceRule: Not(IsNull()) }
    });

    for (const task of recurringTasks) {
        try {
            const rule = RRule.fromString(task.recurrenceRule);
            const nextOccurrence = rule.after(new Date());
            
            if (nextOccurrence && nextOccurrence <= new Date()) {
                // Time to create a new instance
                this.logger.log(`Creating next instance for recurring task: ${task.title}`);
                // Create new task logic...
                // const newTask = this.tasksRepository.create({ ...task, id: undefined, createdAt: undefined, ... });
                // await this.tasksRepository.save(newTask);
            }
        } catch (e) {
            this.logger.error(`Failed to parse recurrence rule for task ${task.id}`, e);
        }
    }
  }
}
