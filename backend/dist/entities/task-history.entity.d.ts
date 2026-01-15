import { Task } from './task.entity';
import { User } from './user.entity';
export declare class TaskHistory {
    id: string;
    taskId: string;
    task: Task;
    changeType: string;
    oldValue: string;
    newValue: string;
    changedById: string;
    changedBy: User;
    createdAt: Date;
}
