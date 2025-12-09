// src/modules/sessions/entities/session.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@ObjectType()
@Entity('sessions')
export class Session extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Field()
  @Column({ name: 'session_id', unique: true })
  @Index()
  sessionId: string;

  @Field({ nullable: true })
  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  device?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  browser?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  os?: string;

  @Field()
  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @Field()
  @Column({ name: 'last_active_at' })
  lastActiveAt: Date;

  @Field()
  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Field()
  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt?: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
