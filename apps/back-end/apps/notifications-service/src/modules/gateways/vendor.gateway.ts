// src/modules/gateways/vendor.gateway.ts
import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { BaseGateway } from './base.gateway';
import { AuthGrpcClient } from '@grpc/clients';
import { ConnectionManagerService } from './connection-manager.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import {
  SocketWithAuth,
  NotificationPayload,
  OrderCreatedPayload,
} from '@common/interfaces';
import { RoomUtils } from '@common/utils';
import {
  RecipientType,
  NotificationType,
  NotificationPriority,
} from '@common/enums';
import { WsExceptionFilter } from '@common/filters';
import { WsLoggingInterceptor } from '@common/interceptors';

@WebSocketGateway({
  namespace: '/vendor',
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
export class VendorGateway extends BaseGateway {
  protected readonly namespace = '/vendor';
  protected readonly recipientType = RecipientType.VENDOR;

  constructor(
    authGrpcClient: AuthGrpcClient,
    connectionManager: ConnectionManagerService,
    notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    super(authGrpcClient, connectionManager, notificationsService);
  }

  protected validateUserType(user: any): boolean {
    return user.role === 'vendor' || user.role === 'admin';
  }

  protected async joinDefaultRooms(socket: SocketWithAuth): Promise<void> {
    if (!socket.user) return;

    const vendorId = socket.user.vendorId;

    if (vendorId) {
      // Join main vendor room
      await this.connectionManager.joinRoom(
        socket,
        RoomUtils.vendorRoom(vendorId),
      );

      // Join orders room
      await this.connectionManager.joinRoom(
        socket,
        RoomUtils.vendorOrdersRoom(vendorId),
      );

      // Join inventory room
      await this.connectionManager.joinRoom(
        socket,
        RoomUtils.vendorInventoryRoom(vendorId),
      );
    }

    // Admins join admin rooms as well
    if (socket.user.role === 'admin') {
      await this.connectionManager.joinRoom(socket, RoomUtils.adminRoom());
    }
  }

  protected getRecipientId(socket: SocketWithAuth): string {
    return socket.user?.vendorId || socket.user?.id || '';
  }

  // Vendor-specific message handlers

  @SubscribeMessage('subscribe-analytics')
  async handleSubscribeAnalytics(
    @ConnectedSocket() socket: SocketWithAuth,
  ): Promise<{ event: string; data: any }> {
    if (!socket.user?.vendorId) {
      return {
        event: 'error',
        data: { code: 'NO_VENDOR', message: 'No vendor ID' },
      };
    }

    const room = RoomUtils.vendorAnalyticsRoom(socket.user.vendorId);
    const success = await this.connectionManager.joinRoom(socket, room);

    return {
      event: success ? 'subscribed-analytics' : 'error',
      data: success
        ? { room, timestamp: new Date().toISOString() }
        : { code: 'SUBSCRIBE_FAILED', message: 'Failed to subscribe' },
    };
  }

  @SubscribeMessage('unsubscribe-analytics')
  async handleUnsubscribeAnalytics(
    @ConnectedSocket() socket: SocketWithAuth,
  ): Promise<{ event: string; data: any }> {
    if (!socket.user?.vendorId) {
      return {
        event: 'error',
        data: { code: 'NO_VENDOR', message: 'No vendor ID' },
      };
    }

    const room = RoomUtils.vendorAnalyticsRoom(socket.user.vendorId);
    await this.connectionManager.leaveRoom(socket, room);

    return {
      event: 'unsubscribed-analytics',
      data: { room, timestamp: new Date().toISOString() },
    };
  }

  // Methods called by consumers to push notifications

  async notifyNewOrder(
    vendorId: string,
    payload: OrderCreatedPayload,
  ): Promise<void> {
    const room = RoomUtils.vendorOrdersRoom(vendorId);

    const notificationPayload: NotificationPayload = {
      id: `order_${payload.orderId}`,
      type: NotificationType.ORDER_CREATED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'New Order Received',
      message: `Order #${payload.orderNumber} - ${payload.items.length} item(s) - $${payload.totalAmount.toFixed(2)}`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/vendor/orders/${payload.orderId}`,
    };

    // Emit to room
    this.emitToRoom(room, 'new-order', notificationPayload);

    // Also emit to main vendor room
    this.emitToRoom(
      RoomUtils.vendorRoom(vendorId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `New order notification sent to vendor ${vendorId}: ${payload.orderNumber}`,
    );
  }

  async notifyOrderCancelled(
    vendorId: string,
    payload: { orderId: string; orderNumber: string; reason: string },
  ): Promise<void> {
    const room = RoomUtils.vendorOrdersRoom(vendorId);

    const notificationPayload: NotificationPayload = {
      id: `cancel_${payload.orderId}`,
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'Order Cancelled',
      message: `Order #${payload.orderNumber} has been cancelled. Reason: ${payload.reason}`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/vendor/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-cancelled', notificationPayload);
    this.emitToRoom(
      RoomUtils.vendorRoom(vendorId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Order cancelled notification sent to vendor ${vendorId}: ${payload.orderNumber}`,
    );
  }

  async notifyLowStock(
    vendorId: string,
    payload: {
      productId: string;
      productName: string;
      currentStock: number;
      threshold: number;
    },
  ): Promise<void> {
    const room = RoomUtils.vendorInventoryRoom(vendorId);

    const notificationPayload: NotificationPayload = {
      id: `lowstock_${payload.productId}_${Date.now()}`,
      type: NotificationType.LOW_STOCK_ALERT,
      priority: NotificationPriority.MEDIUM,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'Low Stock Alert',
      message: `${payload.productName} is running low. Current stock: ${payload.currentStock}`,
      data: payload,
      metadata: {
        source: 'product-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/vendor/products/${payload.productId}/inventory`,
    };

    this.emitToRoom(room, 'low-stock', notificationPayload);
    this.emitToRoom(
      RoomUtils.vendorRoom(vendorId),
      'notification',
      notificationPayload,
    );

    this.logger.log(
      `Low stock notification sent to vendor ${vendorId}: ${payload.productName}`,
    );
  }

  async notifyOrderItemStatusUpdate(
    vendorId: string,
    payload: {
      orderId: string;
      orderNumber: string;
      orderItemId: string;
      productName: string;
      newStatus: string;
    },
  ): Promise<void> {
    const room = RoomUtils.vendorOrdersRoom(vendorId);

    const notificationPayload: NotificationPayload = {
      id: `itemstatus_${payload.orderItemId}_${Date.now()}`,
      type: NotificationType.ORDER_ITEM_STATUS_UPDATED,
      priority: NotificationPriority.LOW,
      recipientType: RecipientType.VENDOR,
      recipientId: vendorId,
      title: 'Order Item Status Updated',
      message: `${payload.productName} in order #${payload.orderNumber} is now ${payload.newStatus}`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/vendor/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'order-item-status', notificationPayload);

    this.logger.debug(
      `Order item status notification sent to vendor ${vendorId}: ${payload.orderNumber}`,
    );
  }
}
