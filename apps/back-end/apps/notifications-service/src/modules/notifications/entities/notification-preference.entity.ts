// src/modules/notifications/entities/notification-preference.entity.ts
import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { NotificationType, RecipientType } from '@common/enums';

@Entity('notification_preferences')
@Unique(['recipientType', 'recipientId', 'notificationType'])
export class NotificationPreference extends BaseEntity {
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

  @Column({
    name: 'notification_type',
    type: 'enum',
    enum: NotificationType,
  })
  notificationType: NotificationType;

  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @Column({ name: 'in_app_enabled', default: true })
  inAppEnabled: boolean;

  @Column({ name: 'sound_enabled', default: true })
  soundEnabled: boolean;
}
