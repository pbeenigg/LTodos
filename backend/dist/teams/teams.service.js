"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_entity_1 = require("../entities/team.entity");
const team_member_entity_1 = require("../entities/team-member.entity");
let TeamsService = class TeamsService {
    constructor(teamsRepository, membersRepository) {
        this.teamsRepository = teamsRepository;
        this.membersRepository = membersRepository;
    }
    async create(createTeamDto, user) {
        const team = this.teamsRepository.create({
            ...createTeamDto,
            ownerId: user.id,
        });
        const savedTeam = await this.teamsRepository.save(team);
        await this.membersRepository.save({
            teamId: savedTeam.id,
            userId: user.id,
            role: team_member_entity_1.TeamRole.OWNER,
        });
        return savedTeam;
    }
    async findAll(user) {
        const memberships = await this.membersRepository.find({
            where: { userId: user.id },
            relations: ['team'],
        });
        return memberships.map(m => m.team);
    }
    async addMember(teamId, addMemberDto) {
        const team = await this.teamsRepository.findOne({ where: { id: teamId } });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${teamId} not found`);
        }
        return this.membersRepository.save({
            teamId,
            ...addMemberDto,
        });
    }
    async findOne(id) {
        const team = await this.teamsRepository.findOne({
            where: { id },
            relations: ['members', 'members.user'],
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${id} not found`);
        }
        return team;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(team_entity_1.Team)),
    __param(1, (0, typeorm_1.InjectRepository)(team_member_entity_1.TeamMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TeamsService);
//# sourceMappingURL=teams.service.js.map