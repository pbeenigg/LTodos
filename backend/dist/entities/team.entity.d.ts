import { User } from './user.entity';
import { TeamMember } from './team-member.entity';
import { Task } from './task.entity';
export declare class Team {
    id: string;
    name: string;
    ownerId: string;
    owner: User;
    members: TeamMember[];
    tasks: Task[];
    createdAt: Date;
    updatedAt: Date;
}
