import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
export declare class TasksScheduler {
    private tasksRepository;
    private readonly logger;
    constructor(tasksRepository: Repository<Task>);
    handleReminders(): Promise<void>;
    handleRecurringTasks(): Promise<void>;
}
