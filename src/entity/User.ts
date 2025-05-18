import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Standup } from './Standup';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true, type: 'text', default: null })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamp', default: null })
  passwordResetExpires: Date | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: 'text', default: null })
  verificationToken: string | null;

  @Column({ nullable: true, type: 'text', default: null })
  refreshToken: string | null;

  @Column({ type: 'simple-array', default: 'user' })
  roles: string[];

  @OneToMany(() => Standup, (standup) => standup.user)
  standups: Standup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 