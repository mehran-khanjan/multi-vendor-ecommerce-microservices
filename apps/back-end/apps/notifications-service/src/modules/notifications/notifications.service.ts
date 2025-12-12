// src/modules/notifications/notifications.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsRepository } from './notifications.repository';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import { CreateNotificationDto, NotificationFilterDto } from './dto';
import {
  RecipientType,
  NotificationType,
  NotificationPriority,
} from '@common/enums';
import { PaginatedResult } from '@common/dto';
import { NotificationPayload } from '@common/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly retentionDays: number;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly configService: ConfigService,
  ) {
    this.retentionDays = this.configService.get<number>(
      'notification.retentionDays',
    );
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationsRepository.create(dto);
    this.logger.debug(
      `Notification created: ${notification.id} for ${dto.recipientType}:${dto.recipientId}`,
    );
    return notification;
  }

  async getNotification(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async getNotifications(
    recipientType: RecipientType,
    recipientId: string,
    filter: NotificationFilterDto = {},
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationsRepository.findByRecipient(
      recipientType,
      recipientId,
      filter,
    );
  }

  async getPendingNotifications(
    recipientType: RecipientType,
    recipientId: string,
    limit?: number,
  ): Promise<Notification[]> {
    return this.notificationsRepository.findPendingByRecipient(
      recipientType,
      recipientId,
      limit || this.configService.get<number>('notification.batchSize'),
    );
  }

  async markAsDelivered(notificationId: string): Promise<void> {
    await this.notificationsRepository.markAsDelivered(notificationId);
  }

  async markAsDeliveredBatch(notificationIds: string[]): Promise<void> {
    await this.notificationsRepository.markAsDeliveredBatch(notificationIds);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationsRepository.markAsRead(notificationId);
  }

  async markAsReadBatch(notificationIds: string[]): Promise<void> {
    await this.notificationsRepository.markAsReadBatch(notificationIds);
  }

  async markAllAsRead(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<number> {
    const count = await this.notificationsRepository.markAllAsRead(
      recipientType,
      recipientId,
    );
    this.logger.debug(
      `Marked ${count} notifications as read for ${recipientType}:${recipientId}`,
    );
    return count;
  }

  async getUnreadCount(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<number> {
    return this.notificationsRepository.getUnreadCount(
      recipientType,
      recipientId,
    );
  }

  buildNotificationPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      recipientType: notification.recipientType,
      recipientId: notification.recipientId,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      metadata: {
        source: notification.source || 'notification-service',
        version: '1.0',
        correlationId: notification.correlationId,
        timestamp: notification.createdAt.toISOString(),
      },
      expiresAt: notification.expiresAt?.toISOString(),
    };
  }

  // Cleanup cron jobs
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldNotifications(): Promise<void> {
    try {
      const deleted = await this.notificationsRepository.deleteOld(
        this.retentionDays,
      );
      this.logger.log(`Cleaned up ${deleted} old notifications`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old notifications: ${error.message}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireNotifications(): Promise<void> {
    try {
      const expired = await this.notificationsRepository.deleteExpired();
      if (expired > 0) {
        this.logger.log(`Expired ${expired} notifications`);
      }
    } catch (error) {
      this.logger.error(`Failed to expire notifications: ${error.message}`);
    }
  }
}
