// src/modules/consumers/inventory.consumer.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseConsumer } from './base.consumer';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RedisService } from '@modules/redis/redis.service';
import { VendorGateway } from '@modules/gateways/vendor.gateway';
import { QUEUES, MESSAGE_TYPES } from '@config/rabbitmq.config';
import { RabbitMQMessage, LowStockPayload } from '@common/interfaces';
import {
  NotificationType,
  NotificationPriority,
  RecipientType,
} from '@common/enums';

@Injectable()
export class InventoryConsumer extends BaseConsumer implements OnModuleInit {
  protected readonly queueName = QUEUES.VENDOR_INVENTORY;

  constructor(
    rabbitMQService: RabbitMQService,
    notificationsService: NotificationsService,
    redisService: RedisService,
    private readonly vendorGateway: VendorGateway,
  ) {
    super(rabbitMQService, notificationsService, redisService);
  }

  async onModuleInit() {
    await this.startConsuming();
  }

  protected async processMessage(message: RabbitMQMessage): Promise<void> {
    switch (message.type) {
      case MESSAGE_TYPES.LOW_STOCK_ALERT:
        await this.handleLowStock(message.payload);
        break;

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private async handleLowStock(
    payload: LowStockPayload & { vendorId: string },
  ): Promise<void> {
    const { vendorId, productId, productName, currentStock, threshold } =
      payload;

    // Store notification
    await this.notificationsService.createNotification({
      type: NotificationType.LOW_STOCK_ALERT,
      priority: NotificationPriority.MEDIUM,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'Low Stock Alert',
      message: `${productName} is running low. Current stock: ${currentStock} (threshold: ${threshold})`,
      data: payload,
      actionUrl: `/vendor/products/${productId}/inventory`,
      source: 'product-service',
    });

    // Send real-time notification
    await this.vendorGateway.notifyLowStock(vendorId, {
      productId,
      productName,
      currentStock,
      threshold,
    });

    this.logger.log(
      `Low stock notification sent for ${productName} to vendor ${vendorId}`,
    );
  }
}
