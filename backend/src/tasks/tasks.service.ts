import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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

  async findAll(user: User): Promise<Task[]> {
    // Find tasks created by user, assigned to user, or in teams user belongs to
    // For simplicity, just find created or assigned for now.
    // Full implementation would require joining teams.
    return this.tasksRepository.find({
      where: [
        { creatorId: user.id },
        { assigneeId: user.id },
      ],
      relations: ['assignee', 'creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['subtasks', 'history', 'comments', 'history.changedBy', 'comments.user'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id);
    
    // Track changes
    for (const key in updateTaskDto) {
      if (updateTaskDto[key] !== task[key]) {
        await this.historyRepository.save({
          taskId: task.id,
          changeType: 'UPDATE',
          oldValue: String(task[key]),
          newValue: String(updateTaskDto[key]),
          changedById: user.id,
        });
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
        relations: ['subtasks']
    });
    if (parent) {
        const allCompleted = parent.subtasks.every(t => t.status === TaskStatus.DONE);
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
