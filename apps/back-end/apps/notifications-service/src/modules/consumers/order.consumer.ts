// src/modules/consumers/order.consumer.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseConsumer } from './base.consumer';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RedisService } from '@modules/redis/redis.service';
import { VendorGateway } from '@modules/gateways/vendor.gateway';
import { CustomerGateway } from '@modules/gateways/customer.gateway';
import { AdminGateway } from '@modules/gateways/admin.gateway';
import { QUEUES, MESSAGE_TYPES } from '@config/rabbitmq.config';
import {
  RabbitMQMessage,
  OrderCreatedPayload,
  OrderStatusPayload,
  OrderItemStatusPayload,
} from '@common/interfaces';
import {
  NotificationType,
  NotificationPriority,
  RecipientType,
} from '@common/enums';

@Injectable()
export class OrderConsumer extends BaseConsumer implements OnModuleInit {
  protected readonly queueName = QUEUES.VENDOR_ORDERS;

  constructor(
    rabbitMQService: RabbitMQService,
    notificationsService: NotificationsService,
    redisService: RedisService,
    private readonly vendorGateway: VendorGateway,
    private readonly customerGateway: CustomerGateway,
    private readonly adminGateway: AdminGateway,
  ) {
    super(rabbitMQService, notificationsService, redisService);
  }

  async onModuleInit() {
    await this.startConsuming();
  }

  protected async processMessage(message: RabbitMQMessage): Promise<void> {
    switch (message.type) {
      case MESSAGE_TYPES.ORDER_CREATED:
        await this.handleOrderCreated(message.payload as OrderCreatedPayload);
        break;

      case MESSAGE_TYPES.ORDER_CANCELLED:
        await this.handleOrderCancelled(message.payload);
        break;

      case MESSAGE_TYPES.ORDER_STATUS_UPDATED:
        await this.handleOrderStatusUpdated(
          message.payload as OrderStatusPayload,
        );
        break;

      case MESSAGE_TYPES.ORDER_ITEM_STATUS_UPDATED:
        await this.handleOrderItemStatusUpdated(
          message.payload as OrderItemStatusPayload,
        );
        break;

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private async handleOrderCreated(
    payload: OrderCreatedPayload,
  ): Promise<void> {
    const { vendorId, customerId, orderId, orderNumber, items, totalAmount } =
      payload;

    // 1. Store notification for vendor
    await this.notificationsService.createNotification({
      type: NotificationType.ORDER_CREATED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'New Order Received',
      message: `Order #${orderNumber} - ${items.length} item(s) - $${totalAmount.toFixed(2)}`,
      data: payload,
      actionUrl: `/vendor/orders/${orderId}`,
      source: 'order-service',
    });

    // 2. Send real-time notification to vendor
    await this.vendorGateway.notifyNewOrder(vendorId, payload);

    // 3. Store notification for customer
    await this.notificationsService.createNotification({
      type: NotificationType.ORDER_CONFIRMED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Confirmed',
      message: `Your order #${orderNumber} has been confirmed!`,
      data: payload,
      actionUrl: `/orders/${orderId}`,
      source: 'order-service',
    });

    // 4. Send real-time notification to customer
    await this.customerGateway.notifyOrderConfirmed(customerId, {
      orderId,
      orderNumber,
      totalAmount,
    });

    // 5. Notify admins for high-value orders (e.g., > $500)
    if (totalAmount >= 500) {
      await this.adminGateway.notifyHighValueOrder({
        orderId,
        orderNumber,
        totalAmount,
        currency: payload.currency,
        customerId,
      });
    }

    this.logger.log(`Order created notifications sent: ${orderNumber}`);
  }

  private async handleOrderCancelled(payload: any): Promise<void> {
    const { vendorId, customerId, orderId, orderNumber, reason } = payload;

    // Notify vendor
    await this.notificationsService.createNotification({
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'Order Cancelled',
      message: `Order #${orderNumber} has been cancelled. Reason: ${reason}`,
      data: payload,
      actionUrl: `/vendor/orders/${orderId}`,
      source: 'order-service',
    });

    await this.vendorGateway.notifyOrderCancelled(vendorId, {
      orderId,
      orderNumber,
      reason,
    });

    // Notify customer
    await this.notificationsService.createNotification({
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Cancelled',
      message: `Your order #${orderNumber} has been cancelled.`,
      data: payload,
      actionUrl: `/orders/${orderId}`,
      source: 'order-service',
    });

    await this.customerGateway.notifyOrderCancelled(customerId, {
      orderId,
      orderNumber,
      reason,
      refundStatus: payload.refundStatus,
    });

    this.logger.log(`Order cancelled notifications sent: ${orderNumber}`);
  }

  private async handleOrderStatusUpdated(
    payload: OrderStatusPayload,
  ): Promise<void> {
    const { orderId, orderNumber, newStatus } = payload;

    // This would need customer/vendor IDs from the payload
    // For now, just log
    this.logger.log(`Order status updated: ${orderNumber} -> ${newStatus}`);

    // Handle specific status changes
    switch (newStatus) {
      case 'shipped':
        // Would send shipping notification
        break;
      case 'delivered':
        // Would send delivery notification
        break;
    }
  }

  private async handleOrderItemStatusUpdated(
    payload: OrderItemStatusPayload,
  ): Promise<void> {
    const { orderId, orderNumber, orderItemId, productName, newStatus } =
      payload;

    // This would need vendor ID from the payload
    this.logger.log(
      `Order item status updated: ${orderNumber} - ${productName} -> ${newStatus}`,
    );
  }
}
