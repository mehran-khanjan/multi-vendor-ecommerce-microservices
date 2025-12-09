// src/modules/users/entities/user-profile.entity.ts
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  birthdate?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  language?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  currency?: string;

  @Field(() => NotificationPreferences, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  notificationPreferences?: NotificationPreferences;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

@ObjectType()
export class NotificationPreferences {
  @Field({ defaultValue: true })
  email: boolean;

  @Field({ defaultValue: false })
  sms: boolean;

  @Field({ defaultValue: true })
  push: boolean;

  @Field({ defaultValue: true })
  marketing: boolean;

  @Field({ defaultValue: true })
  orderUpdates: boolean;

  @Field({ defaultValue: true })
  promotions: boolean;
}
