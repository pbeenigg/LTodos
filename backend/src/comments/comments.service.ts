import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const { taskId, content } = createCommentDto;
    
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const comment = this.commentsRepository.create({
      content,
      taskId,
      userId: user.id,
    });

    const savedComment = await this.commentsRepository.save(comment);
    
    // Return with user info for immediate display
    return this.commentsRepository.findOne({
        where: { id: savedComment.id },
        relations: ['user']
    });
  }

  async remove(id: string, user: User): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
        throw new NotFoundException('Comment not found');
    }
    
    // Only allow author to delete (or admin, but we don't have global admin yet)
    if (comment.userId !== user.id) {
        // throw new ForbiddenException? For now just NotFound or similar to hide it
        throw new NotFoundException('Comment not found or access denied');
    }

    await this.commentsRepository.remove(comment);
  }
}
