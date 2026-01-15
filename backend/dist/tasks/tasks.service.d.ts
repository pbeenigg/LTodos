import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskHistory } from '../entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../entities/user.entity';
export declare class TasksService {
    private tasksRepository;
    private historyRepository;
    constructor(tasksRepository: Repository<Task>, historyRepository: Repository<TaskHistory>);
    create(createTaskDto: CreateTaskDto, user: User): Promise<Task>;
    findAll(user: User): Promise<Task[]>;
    findOne(id: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task>;
    remove(id: string): Promise<void>;
    private checkParentCompletion;
}
