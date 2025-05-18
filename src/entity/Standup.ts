import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Standup {
  @PrimaryColumn()
  date: string;

  @Column('text')
  yesterday: string;

  @Column('text')
  today: string;

  @Column('text')
  blockers: string;

  @Column('boolean', { default: false })
  isBlockerResolved: boolean;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('int', { default: 0 })
  mood: number;

  @Column('int', { default: 0 })
  productivity: number;

  @Column('boolean', { default: false })
  isHighlight: boolean;

  @ManyToOne(() => User, (user) => user.standups, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
