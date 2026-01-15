import { TaskStatus, TaskPriority } from '../../entities/task.entity';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    teamId?: string;
    parentId?: string;
    dueDate?: string;
    reminderTime?: string;
    recurrenceRule?: string;
}
