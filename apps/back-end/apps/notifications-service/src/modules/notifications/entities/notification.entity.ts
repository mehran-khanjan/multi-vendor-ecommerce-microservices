// src/modules/notifications/entities/notification.entity.ts
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import {
  NotificationType,
  NotificationPriority,
  RecipientType,
} from '@common/enums';

export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Index()
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    name: 'recipient_type',
    type: 'enum',
    enum: RecipientType,
  })
  @Index()
  recipientType: RecipientType;

  @Column({ name: 'recipient_id' })
  @Index()
  recipientId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index()
  status: NotificationStatus;

  @Column({ name: 'action_url', nullable: true })
  actionUrl?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'correlation_id', nullable: true })
  @Index()
  correlationId?: string;

  @Column({ nullable: true })
  source?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
