// src/modules/notifications/notifications.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto, NotificationFilterDto } from './dto';
import { RecipientType, NotificationType } from '@common/enums';
import { PaginatedResult, PaginationMeta } from '@common/dto';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.notificationRepository.save(notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async findByRecipient(
    recipientType: RecipientType,
    recipientId: string,
    filter: NotificationFilterDto = {},
  ): Promise<PaginatedResult<Notification>> {
    const where: any = { recipientType, recipientId };

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.unreadOnly) {
      where.status = In([
        NotificationStatus.PENDING,
        NotificationStatus.DELIVERED,
      ]);
    }

    if (filter.fromDate && filter.toDate) {
      where.createdAt = Between(
        new Date(filter.fromDate),
        new Date(filter.toDate),
      );
    } else if (filter.fromDate) {
      where.createdAt = MoreThanOrEqual(new Date(filter.fromDate));
    } else if (filter.toDate) {
      where.createdAt = LessThanOrEqual(new Date(filter.toDate));
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, totalItems] =
      await this.notificationRepository.findAndCount({
        where,
        skip,
        take: limit,
        order: {
          [filter.sortBy || 'createdAt']: filter.sortOrder || 'DESC',
        },
      });

    const meta: PaginationMeta = {
      totalItems,
      itemCount: notifications.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(totalItems / limit),
      hasPreviousPage: page > 1,
    };

    return { items: notifications, meta };
  }

  async findPendingByRecipient(
    recipientType: RecipientType,
    recipientId: string,
    limit = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        recipientType,
        recipientId,
        status: In([NotificationStatus.PENDING]),
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async markAsDelivered(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }

  async markAsDeliveredBatch(ids: string[]): Promise<void> {
    await this.notificationRepository.update(
      { id: In(ids) },
      {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    );
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async markAsReadBatch(ids: string[]): Promise<void> {
    await this.notificationRepository.update(
      { id: In(ids) },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  async markAllAsRead(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        recipientType,
        recipientId,
        status: In([NotificationStatus.PENDING, NotificationStatus.DELIVERED]),
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
    return result.affected || 0;
  }

  async getUnreadCount(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<number> {
    return this.notificationRepository.count({
      where: {
        recipientType,
        recipientId,
        status: In([NotificationStatus.PENDING, NotificationStatus.DELIVERED]),
      },
    });
  }

  async deleteOld(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.notificationRepository.delete({
      createdAt: LessThanOrEqual(cutoffDate),
      status: NotificationStatus.READ,
    });

    return result.affected || 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.notificationRepository.update(
      {
        expiresAt: LessThanOrEqual(new Date()),
        status: In([NotificationStatus.PENDING, NotificationStatus.DELIVERED]),
      },
      { status: NotificationStatus.EXPIRED },
    );
    return result.affected || 0;
  }

  // Preferences
  async getPreference(
    recipientType: RecipientType,
    recipientId: string,
    notificationType: NotificationType,
  ): Promise<NotificationPreference | null> {
    return this.preferenceRepository.findOne({
      where: { recipientType, recipientId, notificationType },
    });
  }

  async getPreferences(
    recipientType: RecipientType,
    recipientId: string,
  ): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { recipientType, recipientId },
    });
  }

  async upsertPreference(
    recipientType: RecipientType,
    recipientId: string,
    notificationType: NotificationType,
    preferences: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    let preference = await this.getPreference(
      recipientType,
      recipientId,
      notificationType,
    );

    if (preference) {
      Object.assign(preference, preferences);
    } else {
      preference = this.preferenceRepository.create({
        recipientType,
        recipientId,
        notificationType,
        ...preferences,
      });
    }

    return this.preferenceRepository.save(preference);
  }
}
