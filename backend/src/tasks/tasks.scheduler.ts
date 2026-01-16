import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { RRule } from 'rrule';

@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringTasks() {
    this.logger.log('Checking for recurring tasks...');
    
    const recurringTasks = await this.tasksRepository.find({
        where: { recurrenceRule: Not(IsNull()) }
    });

    const now = new Date();

    for (const task of recurringTasks) {
        try {
            // Parse options and force dtstart to be consistent
            const ruleOptions = RRule.parseString(task.recurrenceRule);
            // If dtstart is not in the rule string, rrule uses new Date() which is bad for consistency.
            // We force dtstart to be the task creation time (or original due date if available).
            if (!ruleOptions.dtstart) {
                ruleOptions.dtstart = task.dueDate || task.createdAt;
            }
            
            const rule = new RRule(ruleOptions);

            // We want the next occurrence after the last one we generated.
            // If we haven't generated any, we look for the first one after creation/start.
            const lastRun = task.lastRecurrenceDate || ruleOptions.dtstart;
            
            // strictly after lastRun
            const nextOccurrence = rule.after(lastRun);
            
            if (nextOccurrence && nextOccurrence <= now) {
                this.logger.log(`Creating next instance for recurring task: ${task.title} (due: ${nextOccurrence})`);
                
                // Clone task
                // We exclude properties that shouldn't be copied
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, createdAt, updatedAt, recurrenceRule, lastRecurrenceDate, subtasks, history, comments, ...taskData } = task;

                const newTask = this.tasksRepository.create({
                    ...taskData,
                    status: TaskStatus.TODO,
                    dueDate: nextOccurrence, // Set due date to the occurrence date
                    recurrenceRule: null, // Instance does not recurse
                });

                await this.tasksRepository.save(newTask);

                // Update original task's lastRecurrenceDate
                task.lastRecurrenceDate = nextOccurrence;
                await this.tasksRepository.save(task);
            }
        } catch (e) {
            this.logger.error(`Failed to process recurring task ${task.id}`, e);
        }
    }
  }
}
