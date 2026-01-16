import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../entities/task.entity';

export class GetTasksFilterDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsOptional()
  creatorName?: string;

  @IsOptional()
  assigneeName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'creator' | 'id';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  onlyFollowed?: boolean;
}
