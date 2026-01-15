import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity()
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  changeType: string; // e.g., 'STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'UPDATE'

  @Column({ nullable: true, type: 'text' })
  oldValue: string;

  @Column({ nullable: true, type: 'text' })
  newValue: string;

  @Column()
  changedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changedById' })
  changedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
