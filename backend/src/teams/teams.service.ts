import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMember, TeamRole } from '../entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private membersRepository: Repository<TeamMember>,
  ) {}

  async create(createTeamDto: CreateTeamDto, user: User): Promise<Team> {
    const team = this.teamsRepository.create({
      ...createTeamDto,
      ownerId: user.id,
    });
    const savedTeam = await this.teamsRepository.save(team);

    // Add creator as OWNER
    await this.membersRepository.save({
      teamId: savedTeam.id,
      userId: user.id,
      role: TeamRole.OWNER,
    });

    return savedTeam;
  }

  async findAll(user: User): Promise<Team[]> {
    // Find teams where user is a member
    const memberships = await this.membersRepository.find({
      where: { userId: user.id },
      relations: ['team'],
    });
    return memberships.map(m => m.team);
  }

  async addMember(teamId: string, addMemberDto: AddMemberDto): Promise<TeamMember> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    return this.membersRepository.save({
      teamId,
      ...addMemberDto,
    });
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }
    return team;
  }
}
