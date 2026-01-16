import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  IsNull,
  Not,
} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Task, TaskStatus } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      creatorId: user.id,
    });
    return this.tasksRepository.save(task);
  }

  // ... existing methods ...

  @Cron(CronExpression.EVERY_MINUTE) // Check every minute for demo, usually DAILY
  async handleRecurringTasks() {
    const tasks = await this.tasksRepository.find({
      where: {
        recurrenceRule: Not(IsNull()),
      },
    });

    const now = new Date();

    for (const task of tasks) {
      const lastRun = task.lastRecurrenceDate || task.createdAt;
      const rule = task.recurrenceRule.toUpperCase(); // DAILY, WEEKLY, MONTHLY

      let nextRun = new Date(lastRun);

      if (rule === 'DAILY') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (rule === 'WEEKLY') {
        nextRun.setDate(nextRun.getDate() + 7);
      } else if (rule === 'MONTHLY') {
        nextRun.setMonth(nextRun.getMonth() + 1);
      } else {
        continue; // Unknown rule or complex RRULE not supported in simple mode
      }

      // Check if it's time to create a new instance
      if (nextRun <= now) {
        // Create new task instance
        const newTitle = `${task.title} (Recurring)`;
        const newTask = this.tasksRepository.create({
          title: newTitle,
          description: task.description,
          priority: task.priority,
          creatorId: task.creatorId,
          assigneeId: task.assigneeId,
          teamId: task.teamId,
          status: TaskStatus.TODO,
          originTaskId: task.id,
        });

        await this.tasksRepository.save(newTask);

        // Update last recurrence date
        task.lastRecurrenceDate = now;
        await this.tasksRepository.save(task);

        console.log(
          `Created recurring task instance: ${newTask.id} from ${task.id}`,
        );
      }
    }
  }

  async findAll(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const {
      status,
      priority,
      assigneeId,
      creatorId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      onlyFollowed,
      creatorName,
      assigneeName,
    } = filterDto;
    const query = this.tasksRepository.createQueryBuilder('task');

    // Join relations needed for filtering/sorting
    query.leftJoinAndSelect('task.assignee', 'assignee');
    query.leftJoinAndSelect('task.creator', 'creator');
    query.leftJoin('task.followers', 'follower');

    // Base condition: User created OR User is assigned OR User is follower
    if (onlyFollowed) {
      query.where('follower.id = :userId', { userId: user.id });
    } else {
      query.where(
        '(task.creatorId = :userId OR task.assigneeId = :userId OR follower.id = :userId)',
        { userId: user.id },
      );
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    if (creatorId) {
      query.andWhere('task.creatorId = :creatorId', { creatorId });
    }

    if (creatorName) {
      query.andWhere('creator.username LIKE :creatorName', {
        creatorName: `%${creatorName}%`,
      });
    }

    if (assigneeName) {
      query.andWhere('assignee.username LIKE :assigneeName', {
        assigneeName: `%${assigneeName}%`,
      });
    }

    if (startDate) {
      query.andWhere('task.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('task.createdAt <= :endDate', { endDate });
    }

    // Sort
    const order = sortOrder || 'DESC';
    const sort = sortBy || 'createdAt';

    if (sort === 'creator') {
      query.orderBy('creator.username', order);
    } else {
      query.orderBy(`task.${sort}`, order);
    }

    return query.getMany();
  }

  async addFollower(taskId: string, user: User): Promise<void> {
    const task = await this.findOne(taskId);
    // Check if already following
    const isFollowing = task.followers?.some((u) => u.id === user.id);
    if (!isFollowing) {
      if (!task.followers) task.followers = [];
      task.followers.push(user);
      await this.tasksRepository.save(task);
    }
  }

  async removeFollower(taskId: string, user: User): Promise<void> {
    const task = await this.findOne(taskId);
    if (task.followers) {
      task.followers = task.followers.filter((u) => u.id !== user.id);
      await this.tasksRepository.save(task);
    }
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: [
        'subtasks',
        'history',
        'comments',
        'history.changedBy',
        'comments.user',
        'assignee',
        'creator',
        'team',
        'followers',
      ],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id);

    // Track changes
    for (const key in updateTaskDto) {
      // Skip if key is not a property of task entity (although DTO should match)
      // Also handle date comparison
      if (key === 'dueDate' || key === 'reminderTime') {
        const newDate = updateTaskDto[key]
          ? new Date(updateTaskDto[key]).getTime()
          : null;
        const oldDate = task[key] ? new Date(task[key]).getTime() : null;
        if (newDate === oldDate) continue;
      } else if (updateTaskDto[key] === task[key]) {
        continue;
      }

      let oldValue = task[key] ? String(task[key]) : '';
      let newValue = updateTaskDto[key] ? String(updateTaskDto[key]) : '';
      let changeType = key.toUpperCase();

      if (key === 'assigneeId') {
        changeType = 'ASSIGNEE_CHANGED';
      }

      const history = new TaskHistory();
      // Use shallow references to avoid loading full entities
      // and let TypeORM handle the foreign keys via relation mapping
      history.task = { id: task.id } as Task;
      history.changedBy = { id: user.id } as User;

      history.changeType = changeType;
      history.oldValue = oldValue;
      history.newValue = newValue;

      console.log('DEBUG: Creating TaskHistory:', {
        taskId: task.id,
        changeType,
        changedById: user.id,
      });

      try {
        await this.historyRepository.save(history);
      } catch (err) {
        console.error('DEBUG: Failed to save history:', err);
        throw err;
      }
    }

    // If reminderTime is updated, reset isReminderSent
    if (updateTaskDto.reminderTime) {
      const newTime = new Date(updateTaskDto.reminderTime).getTime();
      const oldTime = task.reminderTime ? task.reminderTime.getTime() : 0;

      if (newTime !== oldTime) {
        task.isReminderSent = false;
      }
    }

    Object.assign(task, updateTaskDto);

    // Check if subtasks need to be updated (e.g. parent completed?)
    // Requirement: "当所有子任务完成后，主任务自动完成" -> Logic should be in update subtask?
    // Or "子任务完成后自动完成主任務" -> This sounds like "If all subtasks are done, parent is done"?
    // Or "If parent is done, subtasks are done"?
    // Requirement text: "子任务与任务结构相同，子任务完成后自动完成主任務" -> This usually means "When subtask is completed, check if all siblings are completed, if so, complete parent."

    const updatedTask = await this.tasksRepository.save(task);

    if (updatedTask.parentId && updatedTask.status === TaskStatus.DONE) {
      await this.checkParentCompletion(updatedTask.parentId);
    }

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  private async checkParentCompletion(parentId: string) {
    const parent = await this.tasksRepository.findOne({
      where: { id: parentId },
      relations: ['subtasks'],
    });
    if (parent) {
      const allCompleted = parent.subtasks.every(
        (t) => t.status === TaskStatus.DONE,
      );
      if (allCompleted && parent.status !== TaskStatus.DONE) {
        parent.status = TaskStatus.DONE;
        await this.tasksRepository.save(parent);
        // Recursively check
        if (parent.parentId) {
          await this.checkParentCompletion(parent.parentId);
        }
      }
    }
  }
}
