// src/modules/gateways/admin.gateway.ts
import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
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
  namespace: '/admin',
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
export class AdminGateway extends BaseGateway {
  protected readonly namespace = '/admin';
  protected readonly recipientType = RecipientType.ADMIN;

  constructor(
    authGrpcClient: AuthGrpcClient,
    connectionManager: ConnectionManagerService,
    notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    super(authGrpcClient, connectionManager, notificationsService);
  }

  protected validateUserType(user: any): boolean {
    return user.role === 'admin';
  }

  protected async joinDefaultRooms(socket: SocketWithAuth): Promise<void> {
    if (!socket.user) return;

    // Join all admin rooms
    await this.connectionManager.joinRoom(socket, RoomUtils.adminRoom());
    await this.connectionManager.joinRoom(socket, RoomUtils.adminOrdersRoom());
    await this.connectionManager.joinRoom(socket, RoomUtils.adminVendorsRoom());
    await this.connectionManager.joinRoom(socket, RoomUtils.adminSystemRoom());
  }

  protected getRecipientId(socket: SocketWithAuth): string {
    return socket.user?.id || '';
  }

  // Admin-specific handlers

  @SubscribeMessage('get-stats')
  async handleGetStats(
    @ConnectedSocket() socket: SocketWithAuth,
  ): Promise<{ event: string; data: any }> {
    const stats = await this.connectionManager.getStats();

    return {
      event: 'stats',
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('broadcast')
  async handleBroadcast(
    @ConnectedSocket() socket: SocketWithAuth,
    @MessageBody() data: { room?: string; event: string; payload: any },
  ): Promise<{ event: string; data: any }> {
    if (!socket.user || socket.user.role !== 'admin') {
      return {
        event: 'error',
        data: { code: 'FORBIDDEN', message: 'Admin access required' },
      };
    }

    if (data.room) {
      this.emitToRoom(data.room, data.event, data.payload);
    } else {
      this.emitToAll(data.event, data.payload);
    }

    return {
      event: 'broadcast-sent',
      data: {
        room: data.room,
        event: data.event,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Admin notification methods

  async notifyNewVendor(payload: {
    vendorId: string;
    vendorName: string;
    email: string;
  }): Promise<void> {
    const room = RoomUtils.adminVendorsRoom();

    const notificationPayload: NotificationPayload = {
      id: `vendor_${payload.vendorId}`,
      type: NotificationType.VENDOR_APPROVED,
      priority: NotificationPriority.MEDIUM,
      recipientType: RecipientType.ADMIN,
      recipientId: 'all',
      title: 'New Vendor Registration',
      message: `${payload.vendorName} (${payload.email}) has registered as a vendor.`,
      data: payload,
      metadata: {
        source: 'auth-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/admin/vendors/${payload.vendorId}`,
    };

    this.emitToRoom(room, 'new-vendor', notificationPayload);
    this.emitToRoom(RoomUtils.adminRoom(), 'notification', notificationPayload);

    this.logger.log(
      `New vendor notification sent to admins: ${payload.vendorName}`,
    );
  }

  async notifySystemAlert(payload: {
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const room = RoomUtils.adminSystemRoom();

    const priority =
      payload.severity === 'critical' || payload.severity === 'error'
        ? NotificationPriority.URGENT
        : payload.severity === 'warning'
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM;

    const notificationPayload: NotificationPayload = {
      id: `system_${Date.now()}`,
      type: NotificationType.SYSTEM_ALERT,
      priority,
      recipientType: RecipientType.ADMIN,
      recipientId: 'all',
      title: payload.title,
      message: payload.message,
      data: { severity: payload.severity, ...payload.metadata },
      metadata: {
        source: payload.source,
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
    };

    this.emitToRoom(room, 'system-alert', notificationPayload);
    this.emitToRoom(RoomUtils.adminRoom(), 'notification', notificationPayload);

    this.logger.log(`System alert sent to admins: ${payload.title}`);
  }

  async notifyHighValueOrder(payload: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    currency: string;
    customerId: string;
  }): Promise<void> {
    const room = RoomUtils.adminOrdersRoom();

    const notificationPayload: NotificationPayload = {
      id: `highvalue_${payload.orderId}`,
      type: NotificationType.ORDER_CREATED,
      priority: NotificationPriority.HIGH,
      recipientType: RecipientType.ADMIN,
      recipientId: 'all',
      title: 'High Value Order',
      message: `Order #${payload.orderNumber} worth ${payload.currency} ${payload.totalAmount.toFixed(2)} has been placed.`,
      data: payload,
      metadata: {
        source: 'order-service',
        version: '1.0',
        timestamp: new Date().toISOString(),
      },
      actionUrl: `/admin/orders/${payload.orderId}`,
    };

    this.emitToRoom(room, 'high-value-order', notificationPayload);
    this.emitToRoom(RoomUtils.adminRoom(), 'notification', notificationPayload);

    this.logger.log(
      `High value order notification sent to admins: ${payload.orderNumber}`,
    );
  }
}
