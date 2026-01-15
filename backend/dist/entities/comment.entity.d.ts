import { Task } from './task.entity';
import { User } from './user.entity';
export declare class Comment {
    id: string;
    taskId: string;
    task: Task;
    content: string;
    userId: string;
    user: User;
    createdAt: Date;
}
