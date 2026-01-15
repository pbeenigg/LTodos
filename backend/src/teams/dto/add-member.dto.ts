import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { TeamRole } from '../../entities/team-member.entity';

export class AddMemberDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(TeamRole)
  role: TeamRole;
}
