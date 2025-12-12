// src/modules/notifications/dto/create-notification.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsUUID,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
  RecipientType,
} from '@common/enums';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @IsString()
  recipientId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
