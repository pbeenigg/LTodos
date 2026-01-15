import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksScheduler } from './tasks.scheduler';
import { Task } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskHistory, Comment])],
  controllers: [TasksController],
  providers: [TasksService, TasksScheduler],
})
export class TasksModule {}
