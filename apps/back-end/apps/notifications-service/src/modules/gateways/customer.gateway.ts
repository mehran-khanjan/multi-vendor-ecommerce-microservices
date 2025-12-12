// src/modules/gateways/customer.gateway.ts
import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { BaseGateway } from './base.gateway';
import { AuthGrpcClient } from '@grpc/clients';
import { ConnectionManagerService } from './connection-manager.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { SocketWithAuth, NotificationPayload } from '@common/interfaces';
import { RoomUtils } from '@common/utils';
import {
  RecipientType,
  NotificationType,
  NotificationPriority,
} from '@common/enums';
import { WsExceptionFilter } from '@common/filters';
import { WsLoggingInterceptor } from '@common/interceptors';

@WebSocketGateway({
  namespace: '/customer',
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
export class CustomerGateway extends BaseGateway {
  protected readonly namespace = '/customer';
  protected readonly recipientType = RecipientType.CUSTOMER;

  constructor(
    authGrpcClient: AuthGrpcClient,
    connectionManager: ConnectionManagerService,
    notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    super(authGrpcClient, connectionManager, notificationsService);
  }

  protected validateUserType(user: any): boolean {
    return user.role === 'customer' || user.role === 'admin';
  }

  protected async joinDefaultRooms(socket: SocketWithAuth): Promise<void> {
    if (!socket.user) return;

    const customerId = socket.user.id;

    // Join main customer room
    await this.connectionManager.joinRoom(
      socket,
      RoomUtils.customerRoom(customerId),
    );

    // Join orders room
    await this.connectionManager.joinRoom(
      socket,
      RoomUtils.customerOrdersRoom(customerId),
    );
  }

  protected getRecipientId(socket: SocketWithAuth): string {
    return socket.user?.id || '';
  }

  // Customer-specific notification methods

  async notifyOrderConfirmed(
    customerId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      estimatedDelivery?: string;
    },
  ): Promise<void> {
    const room = RoomUtils.customerOrdersRoom(customerId);

    const notificationPayload: NotificationPayload = {
      id: `confirmed_${payload.orderId}`,
      type: NotificationType.ORDER_CONFIRMED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Confirmed',
      message: `Your order #${payload.orderNumber} has been confirmed!`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-confirmed', notificationPayload);
    this.emitToRoom(
      RoomUtils.customerRoom(customerId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Order confirmed notification sent to customer ${customerId}`,
    );
  }

  async notifyOrderShipped(
    customerId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      trackingNumber?: string;
      trackingUrl?: string;
      carrier?: string;
    },
  ): Promise<void> {
    const room = RoomUtils.customerOrdersRoom(customerId);

    const notificationPayload: NotificationPayload = {
      id: `shipped_${payload.orderId}`,
      type: NotificationType.ORDER_SHIPPED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Shipped',
      message: `Your order #${payload.orderNumber} has been shipped!${
        payload.trackingNumber ? ` Tracking: ${payload.trackingNumber}` : ''
      }`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: payload.trackingUrl || `/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-shipped', notificationPayload);
    this.emitToRoom(
      RoomUtils.customerRoom(customerId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Order shipped notification sent to customer ${customerId}`,
    );
  }

  async notifyOrderDelivered(
    customerId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      deliveredAt: string;
    },
  ): Promise<void> {
    const room = RoomUtils.customerOrdersRoom(customerId);

    const notificationPayload: NotificationPayload = {
      id: `delivered_${payload.orderId}`,
      type: NotificationType.ORDER_DELIVERED,
      priority: NotificationPriority.MEDIUM,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Delivered',
      message: `Your order #${payload.orderNumber} has been delivered!`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-delivered', notificationPayload);
    this.emitToRoom(
      RoomUtils.customerRoom(customerId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Order delivered notification sent to customer ${customerId}`,
    );
  }

  async notifyOrderCancelled(
    customerId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      reason: string;
      refundStatus?: string;
    },
  ): Promise<void> {
    const room = RoomUtils.customerOrdersRoom(customerId);

    const notificationPayload: NotificationPayload = {
      id: `cancelled_${payload.orderId}`,
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Order Cancelled',
      message: `Your order #${payload.orderNumber} has been cancelled.`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-cancelled', notificationPayload);
    this.emitToRoom(
      RoomUtils.customerRoom(customerId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Order cancelled notification sent to customer ${customerId}`,
    );
  }

  async notifyRefundProcessed(
    customerId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      refundAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const room = RoomUtils.customerRoom(customerId);

    const notificationPayload: NotificationPayload = {
      id: `refund_${payload.orderId}`,
      type: NotificationType.REFUND_PROCESSED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerId,
      title: 'Refund Processed',
      message: `A refund of ${payload.currency} ${payload.refundAmount.toFixed(2)} for order #${payload.orderNumber} has been processed.`,
      data: payload,
      metadata: {
        source: 'payment-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'refund-processed', notificationPayload);

    this.logger.log(`Refund notification sent to customer ${customerId}`);
  }
}
