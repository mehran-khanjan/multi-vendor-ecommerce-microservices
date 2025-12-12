// src/modules/notifications/dto/notification-filter.dto.ts
import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { NotificationType, NotificationPriority } from '@common/enums';
import { NotificationStatus } from '../entities/notification.entity';
import { PaginationDto } from '@common/dto';

export class NotificationFilterDto extends PaginationDto {
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
