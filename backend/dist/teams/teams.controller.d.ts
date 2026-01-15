import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(createTeamDto: CreateTeamDto, req: any): Promise<import("../entities/team.entity").Team>;
    findAll(req: any): Promise<import("../entities/team.entity").Team[]>;
    findOne(id: string): Promise<import("../entities/team.entity").Team>;
    addMember(id: string, addMemberDto: AddMemberDto): Promise<import("../entities/team-member.entity").TeamMember>;
}
