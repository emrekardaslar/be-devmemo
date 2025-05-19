import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('standup')
export class Standup {
  @PrimaryColumn({ name: 'date' })
  date: string;

  @PrimaryColumn({ name: 'userId' })
  userId: string;

  @Column({ name: 'yesterday', type: 'text' })
  yesterday: string;

  @Column({ name: 'today', type: 'text' })
  today: string;

  @Column({ name: 'blockers', type: 'text' })
  blockers: string;

  @Column({ name: 'isBlockerResolved', type: 'boolean', default: false })
  isBlockerResolved: boolean;

  @Column({ name: 'tags', type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'mood', type: 'int', default: 0 })
  mood: number;

  @Column({ name: 'productivity', type: 'int', default: 0 })
  productivity: number;

  @Column({ name: 'isHighlight', type: 'boolean', default: false })
  isHighlight: boolean;

  @ManyToOne(() => User, (user) => user.standups, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
