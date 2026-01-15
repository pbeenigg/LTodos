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
var TasksScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../entities/task.entity");
const rrule_1 = require("rrule");
let TasksScheduler = TasksScheduler_1 = class TasksScheduler {
    constructor(tasksRepository) {
        this.tasksRepository = tasksRepository;
        this.logger = new common_1.Logger(TasksScheduler_1.name);
    }
    async handleReminders() {
        const now = new Date();
        const tasksToRemind = await this.tasksRepository.find({
            where: {
                reminderTime: (0, typeorm_2.LessThan)(now),
                status: (0, typeorm_2.Not)(task_entity_1.TaskStatus.DONE),
            }
        });
        if (tasksToRemind.length > 0) {
            this.logger.log(`Found ${tasksToRemind.length} tasks to remind.`);
            tasksToRemind.forEach(task => {
                this.logger.log(`Reminder for task: ${task.title} (ID: ${task.id})`);
            });
        }
    }
    async handleRecurringTasks() {
        this.logger.log('Checking for recurring tasks...');
        const recurringTasks = await this.tasksRepository.find({
            where: { recurrenceRule: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) }
        });
        for (const task of recurringTasks) {
            try {
                const rule = rrule_1.RRule.fromString(task.recurrenceRule);
                const nextOccurrence = rule.after(new Date());
                if (nextOccurrence && nextOccurrence <= new Date()) {
                    this.logger.log(`Creating next instance for recurring task: ${task.title}`);
                }
            }
            catch (e) {
                this.logger.error(`Failed to parse recurrence rule for task ${task.id}`, e);
            }
        }
    }
};
exports.TasksScheduler = TasksScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksScheduler.prototype, "handleReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksScheduler.prototype, "handleRecurringTasks", null);
exports.TasksScheduler = TasksScheduler = TasksScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TasksScheduler);
//# sourceMappingURL=tasks.scheduler.js.map