import { TeamMember } from './team-member.entity';
import { Task } from './task.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    teamMemberships: TeamMember[];
    createdTasks: Task[];
    assignedTasks: Task[];
    createdAt: Date;
    updatedAt: Date;
}
