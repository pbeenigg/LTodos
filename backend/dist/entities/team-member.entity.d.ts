import { User } from './user.entity';
import { Team } from './team.entity';
export declare enum TeamRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER"
}
export declare class TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: TeamRole;
    team: Team;
    user: User;
    joinedAt: Date;
}
