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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../entities/task.entity");
const task_history_entity_1 = require("../entities/task-history.entity");
let TasksService = class TasksService {
    constructor(tasksRepository, historyRepository) {
        this.tasksRepository = tasksRepository;
        this.historyRepository = historyRepository;
    }
    async create(createTaskDto, user) {
        const task = this.tasksRepository.create({
            ...createTaskDto,
            creatorId: user.id,
        });
        return this.tasksRepository.save(task);
    }
    async findAll(user) {
        return this.tasksRepository.find({
            where: [
                { creatorId: user.id },
                { assigneeId: user.id },
            ],
            relations: ['assignee', 'creator'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: ['subtasks', 'history', 'comments', 'history.changedBy', 'comments.user'],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }
    async update(id, updateTaskDto, user) {
        const task = await this.findOne(id);
        for (const key in updateTaskDto) {
            if (updateTaskDto[key] !== task[key]) {
                await this.historyRepository.save({
                    taskId: task.id,
                    changeType: 'UPDATE',
                    oldValue: String(task[key]),
                    newValue: String(updateTaskDto[key]),
                    changedById: user.id,
                });
            }
        }
        Object.assign(task, updateTaskDto);
        const updatedTask = await this.tasksRepository.save(task);
        if (updatedTask.parentId && updatedTask.status === task_entity_1.TaskStatus.DONE) {
            await this.checkParentCompletion(updatedTask.parentId);
        }
        return updatedTask;
    }
    async remove(id) {
        const result = await this.tasksRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
    }
    async checkParentCompletion(parentId) {
        const parent = await this.tasksRepository.findOne({
            where: { id: parentId },
            relations: ['subtasks']
        });
        if (parent) {
            const allCompleted = parent.subtasks.every(t => t.status === task_entity_1.TaskStatus.DONE);
            if (allCompleted && parent.status !== task_entity_1.TaskStatus.DONE) {
                parent.status = task_entity_1.TaskStatus.DONE;
                await this.tasksRepository.save(parent);
                if (parent.parentId) {
                    await this.checkParentCompletion(parent.parentId);
                }
            }
        }
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(task_history_entity_1.TaskHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map