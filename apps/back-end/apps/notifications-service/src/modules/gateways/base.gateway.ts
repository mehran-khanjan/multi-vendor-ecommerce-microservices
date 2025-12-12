// src/modules/gateways/base.gateway.ts
import { Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Namespace } from 'socket.io';
import { AuthGrpcClient } from '@grpc/clients';
import { ConnectionManagerService } from './connection-manager.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { SocketWithAuth, NotificationPayload } from '@common/interfaces';
import { WsExceptionFilter } from '@common/filters';
import { WsLoggingInterceptor } from '@common/interceptors';
import { RecipientType } from '@common/enums';

export abstract class BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly logger: Logger;
  protected abstract readonly namespace: string;
  protected abstract readonly recipientType: RecipientType;

  @WebSocketServer()
  protected server: Server | Namespace;

  constructor(
    protected readonly authGrpcClient: AuthGrpcClient,
    protected readonly connectionManager: ConnectionManagerService,
    protected readonly notificationsService: NotificationsService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  afterInit(server: Server | Namespace): void {
    this.logger.log(`${this.constructor.name} initialized`);
  }

  async handleConnection(socket: SocketWithAuth): Promise<void> {
    try {
      // Extract token from handshake
      const token = this.extractToken(socket);

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided - ${socket.id}`,
        );
        socket.emit('error', {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        });
        socket.disconnect(true);
        return;
      }

      // Validate token
      const authResult = await this.authGrpcClient.validateToken(token);

      if (!authResult.valid || !authResult.user) {
        this.logger.warn(`Connection rejected: Invalid token - ${socket.id}`);
        socket.emit('error', {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
        });
        socket.disconnect(true);
        return;
      }

      // Validate user type for this namespace
      if (!this.validateUserType(authResult.user)) {
        this.logger.warn(
          `Connection rejected: Invalid user type ${authResult.user.role} for namespace ${this.namespace} - ${socket.id}`,
        );
        socket.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this namespace',
        });
        socket.disconnect(true);
        return;
      }

      // Attach user to socket
      socket.user = authResult.user;
      socket.connectedAt = new Date();
      socket.lastActivity = new Date();

      // Register connection
      const connectionId = await this.connectionManager.registerConnection(
        socket,
        this.namespace,
      );
      socket.connectionId = connectionId;

      // Join default rooms
      await this.joinDefaultRooms(socket);

      // Send pending notifications
      await this.sendPendingNotifications(socket);

      // Emit connected event
      socket.emit('connected', {
        connectionId,
        userId: authResult.user.id,
        rooms: Array.from(socket.rooms),
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Client connected: ${socket.id} - User: ${authResult.user.id} (${authResult.user.role})`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      socket.emit('error', {
        code: 'CONNECTION_ERROR',
        message: 'Connection failed',
      });
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: SocketWithAuth): Promise<void> {
    try {
      await this.connectionManager.leaveAllRooms(socket);
      await this.connectionManager.unregisterConnection(socket);

      if (socket.user) {
        this.logger.log(
          `Client disconnected: ${socket.id} - User: ${socket.user.id}`,
        );
      } else {
        this.logger.log(`Client disconnected: ${socket.id}`);
      }
    } catch (error) {
      this.logger.error(`Disconnect error: ${error.message}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: SocketWithAuth): {
    event: string;
    data: any;
  } {
    this.connectionManager.updateActivity(socket);
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() socket: SocketWithAuth,
    @MessageBody() data: { room: string },
  ): Promise<{ event: string; data: any }> {
    const success = await this.connectionManager.joinRoom(socket, data.room);

    if (success) {
      return {
        event: 'room-joined',
        data: { room: data.room, timestamp: new Date().toISOString() },
      };
    }

    return {
      event: 'error',
      data: { code: 'JOIN_FAILED', message: 'Failed to join room' },
    };
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: SocketWithAuth,
    @MessageBody() data: { room: string },
  ): Promise<{ event: string; data: any }> {
    await this.connectionManager.leaveRoom(socket, data.room);

    return {
      event: 'room-left',
      data: { room: data.room, timestamp: new Date().toISOString() },
    };
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() socket: SocketWithAuth,
    @MessageBody() data: { notificationIds: string[] },
  ): Promise<{ event: string; data: any }> {
    try {
      await this.notificationsService.markAsReadBatch(data.notificationIds);

      return {
        event: 'notifications-marked-read',
        data: {
          notificationIds: data.notificationIds,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { code: 'MARK_READ_FAILED', message: error.message },
      };
    }
  }

  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(
    @ConnectedSocket() socket: SocketWithAuth,
  ): Promise<{ event: string; data: any }> {
    if (!socket.user) {
      return {
        event: 'error',
        data: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      };
    }

    const recipientId = this.getRecipientId(socket);
    const count = await this.notificationsService.getUnreadCount(
      this.recipientType,
      recipientId,
    );

    return {
      event: 'unread-count',
      data: { count, timestamp: new Date().toISOString() },
    };
  }

  // Abstract methods to be implemented by specific gateways
  protected abstract validateUserType(user: any): boolean;
  protected abstract joinDefaultRooms(socket: SocketWithAuth): Promise<void>;
  protected abstract getRecipientId(socket: SocketWithAuth): string;

  // Helper methods
  protected extractToken(socket: SocketWithAuth): string | null {
    // Try auth header first
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try query parameter
    const token = socket.handshake.query.token;
    if (token && typeof token === 'string') {
      return token;
    }

    // Try auth object
    if (socket.handshake.auth && socket.handshake.auth.token) {
      return socket.handshake.auth.token;
    }

    return null;
  }

  protected async sendPendingNotifications(
    socket: SocketWithAuth,
  ): Promise<void> {
    if (!socket.user) return;

    try {
      const recipientId = this.getRecipientId(socket);
      const pendingNotifications =
        await this.notificationsService.getPendingNotifications(
          this.recipientType,
          recipientId,
        );

      if (pendingNotifications.length > 0) {
        const payloads = pendingNotifications.map((n) =>
          this.notificationsService.buildNotificationPayload(n),
        );

        socket.emit('pending-notifications', {
          notifications: payloads,
          count: payloads.length,
          timestamp: new Date().toISOString(),
        });

        // Mark as delivered
        const ids = pendingNotifications.map((n) => n.id);
        await this.notificationsService.markAsDeliveredBatch(ids);

        this.logger.debug(
          `Sent ${payloads.length} pending notifications to ${socket.user.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send pending notifications: ${error.message}`,
      );
    }
  }

  // Methods to emit notifications
  async emitToUser(userId: string, event: string, payload: any): Promise<void> {
    const connections = await this.connectionManager.getUserConnections(userId);

    for (const socketId of connections) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  emitToRoom(room: string, event: string, payload: any): void {
    this.server.to(room).emit(event, payload);
  }

  emitToAll(event: string, payload: any): void {
    this.server.emit(event, payload);
  }
}
