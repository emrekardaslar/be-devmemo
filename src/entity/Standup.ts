import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column('simple-array')
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
