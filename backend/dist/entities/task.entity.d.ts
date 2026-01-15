import { User } from './user.entity';
import { Team } from './team.entity';
import { TaskHistory } from './task-history.entity';
import { Comment } from './comment.entity';
export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare class Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    creatorId: string;
    creator: User;
    assigneeId: string;
    assignee: User;
    teamId: string;
    team: Team;
    parentId: string;
    parent: Task;
    subtasks: Task[];
    dueDate: Date;
    reminderTime: Date;
    recurrenceRule: string;
    history: TaskHistory[];
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
}
