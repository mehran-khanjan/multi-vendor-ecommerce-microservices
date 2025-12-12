// src/modules/gateways/connection-manager.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@modules/redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from '@config/redis.config';
import { SocketWithAuth, ConnectionInfo } from '@common/interfaces';
import { RoomUtils } from '@common/utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private readonly maxConnectionsPerUser: number;
  private readonly connections = new Map<string, ConnectionInfo>();

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.maxConnectionsPerUser = this.configService.get<number>(
      'socket.connectionsPerUser',
    );
  }

  async registerConnection(
    socket: SocketWithAuth,
    namespace: string,
  ): Promise<string> {
    const connectionId = uuidv4();
    const user = socket.user;

    if (!user) {
      throw new Error('Cannot register connection without authenticated user');
    }

    // Check max connections per user
    const userConnectionsKey = `${REDIS_KEYS.USER_CONNECTIONS}${user.id}`;
    const currentConnections =
      await this.redisService.scard(userConnectionsKey);

    if (currentConnections >= this.maxConnectionsPerUser) {
      // Get oldest connection and disconnect it
      const oldConnections =
        await this.redisService.smembers(userConnectionsKey);
      if (oldConnections.length > 0) {
        this.logger.warn(
          `User ${user.id} exceeded max connections. Oldest will be disconnected.`,
        );
        // The oldest connection handling would be done by the gateway
      }
    }

    const connectionInfo: ConnectionInfo = {
      socketId: socket.id,
      connectionId,
      userId: user.id,
      userRole: user.role,
      vendorId: user.vendorId,
      namespace,
      rooms: [],
      connectedAt: new Date(),
      lastActivity: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
      ipAddress: socket.handshake.address,
    };

    // Store in memory
    this.connections.set(socket.id, connectionInfo);
    // Store in Redis for cross-instance awareness
    await this.redisService.set(
      `${REDIS_KEYS.CONNECTION_PREFIX}${socket.id}`,
      JSON.stringify(connectionInfo),
      REDIS_TTL.CONNECTION,
    );

    // Add to user's connection set
    await this.redisService.sadd(userConnectionsKey, socket.id);
    await this.redisService.expire(userConnectionsKey, REDIS_TTL.CONNECTION);

    // Update last seen
    await this.redisService.set(
      `${REDIS_KEYS.USER_LAST_SEEN}${user.id}`,
      new Date().toISOString(),
      REDIS_TTL.LAST_SEEN,
    );

    this.logger.log(
      `Connection registered: ${socket.id} for user ${user.id} (${user.role}) in namespace ${namespace}`,
    );

    return connectionId;
  }

  async unregisterConnection(socket: SocketWithAuth): Promise<void> {
    const user = socket.user;

    if (!user) {
      this.connections.delete(socket.id);
      return;
    }

    // Remove from memory
    this.connections.delete(socket.id);

    // Remove from Redis
    await this.redisService.del(`${REDIS_KEYS.CONNECTION_PREFIX}${socket.id}`);

    // Remove from user's connection set
    const userConnectionsKey = `${REDIS_KEYS.USER_CONNECTIONS}${user.id}`;
    await this.redisService.srem(userConnectionsKey, socket.id);

    // Update last seen
    await this.redisService.set(
      `${REDIS_KEYS.USER_LAST_SEEN}${user.id}`,
      new Date().toISOString(),
      REDIS_TTL.LAST_SEEN,
    );

    this.logger.log(
      `Connection unregistered: ${socket.id} for user ${user.id}`,
    );
  }

  async joinRoom(socket: SocketWithAuth, room: string): Promise<boolean> {
    const user = socket.user;

    if (!user) {
      return false;
    }

    // Validate room access
    if (!RoomUtils.canJoinRoom(room, user.role, user.id, user.vendorId)) {
      this.logger.warn(`User ${user.id} denied access to room ${room}`);
      return false;
    }

    // Join Socket.IO room
    socket.join(room);

    // Update connection info
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms.push(room);
      await this.redisService.set(
        `${REDIS_KEYS.CONNECTION_PREFIX}${socket.id}`,
        JSON.stringify(connectionInfo),
        REDIS_TTL.CONNECTION,
      );
    }

    // Track room membership in Redis
    await this.redisService.sadd(
      `${REDIS_KEYS.ROOM_MEMBERS}${room}`,
      socket.id,
    );

    this.logger.debug(`User ${user.id} joined room ${room}`);

    return true;
  }

  async leaveRoom(socket: SocketWithAuth, room: string): Promise<void> {
    const user = socket.user;

    // Leave Socket.IO room
    socket.leave(room);

    // Update connection info
    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms = connectionInfo.rooms.filter((r) => r !== room);
      await this.redisService.set(
        `${REDIS_KEYS.CONNECTION_PREFIX}${socket.id}`,
        JSON.stringify(connectionInfo),
        REDIS_TTL.CONNECTION,
      );
    }

    // Remove from room membership in Redis
    await this.redisService.srem(
      `${REDIS_KEYS.ROOM_MEMBERS}${room}`,
      socket.id,
    );

    if (user) {
      this.logger.debug(`User ${user.id} left room ${room}`);
    }
  }

  async leaveAllRooms(socket: SocketWithAuth): Promise<void> {
    const connectionInfo = this.connections.get(socket.id);

    if (connectionInfo) {
      for (const room of connectionInfo.rooms) {
        await this.leaveRoom(socket, room);
      }
    }
  }

  async updateActivity(socket: SocketWithAuth): Promise<void> {
    const connectionInfo = this.connections.get(socket.id);

    if (connectionInfo) {
      connectionInfo.lastActivity = new Date();

      await this.redisService.set(
        `${REDIS_KEYS.CONNECTION_PREFIX}${socket.id}`,
        JSON.stringify(connectionInfo),
        REDIS_TTL.CONNECTION,
      );
    }

    if (socket.user) {
      await this.redisService.set(
        `${REDIS_KEYS.USER_LAST_SEEN}${socket.user.id}`,
        new Date().toISOString(),
        REDIS_TTL.LAST_SEEN,
      );
    }
  }

  getConnection(socketId: string): ConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  async getUserConnections(userId: string): Promise<string[]> {
    const userConnectionsKey = `${REDIS_KEYS.USER_CONNECTIONS}${userId}`;
    return this.redisService.smembers(userConnectionsKey);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const connections = await this.getUserConnections(userId);
    return connections.length > 0;
  }

  async getLastSeen(userId: string): Promise<Date | null> {
    const lastSeen = await this.redisService.get(
      `${REDIS_KEYS.USER_LAST_SEEN}${userId}`,
    );
    return lastSeen ? new Date(lastSeen) : null;
  }

  async getRoomMembers(room: string): Promise<string[]> {
    return this.redisService.smembers(`${REDIS_KEYS.ROOM_MEMBERS}${room}`);
  }

  async getRoomMemberCount(room: string): Promise<number> {
    return this.redisService.scard(`${REDIS_KEYS.ROOM_MEMBERS}${room}`);
  }

  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  async getStats(): Promise<{
    totalConnections: number;
    connectionsByNamespace: Record<string, number>;
    connectionsByRole: Record<string, number>;
  }> {
    const connectionsByNamespace: Record<string, number> = {};
    const connectionsByRole: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      // By namespace
      connectionsByNamespace[connection.namespace] =
        (connectionsByNamespace[connection.namespace] || 0) + 1;

      // By role
      connectionsByRole[connection.userRole] =
        (connectionsByRole[connection.userRole] || 0) + 1;
    }

    return {
      totalConnections: this.connections.size,
      connectionsByNamespace,
      connectionsByRole,
    };
  }
}
