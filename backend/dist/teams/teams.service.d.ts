import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMember } from '../entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { User } from '../entities/user.entity';
export declare class TeamsService {
    private teamsRepository;
    private membersRepository;
    constructor(teamsRepository: Repository<Team>, membersRepository: Repository<TeamMember>);
    create(createTeamDto: CreateTeamDto, user: User): Promise<Team>;
    findAll(user: User): Promise<Team[]>;
    addMember(teamId: string, addMemberDto: AddMemberDto): Promise<TeamMember>;
    findOne(id: string): Promise<Team>;
}
