import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(createUserDto: CreateUserDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            teamMemberships: import("../entities/team-member.entity").TeamMember[];
            createdTasks: import("../entities/task.entity").Task[];
            assignedTasks: import("../entities/task.entity").Task[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(req: any): any;
}
