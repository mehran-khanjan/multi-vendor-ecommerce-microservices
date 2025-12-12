// src/common/interfaces/socket-with-auth.interface.ts
import { Socket } from 'socket.io';
import { UserContext } from './user-context.interface';

export interface SocketWithAuth extends Socket {
  user?: UserContext;
  connectionId?: string;
  connectedAt?: Date;
  lastActivity?: Date;
}

export interface ConnectionInfo {
  socketId: string;
  connectionId: string;
  userId: string;
  userRole: string;
  vendorId?: string;
  namespace: string;
  rooms: string[];
  connectedAt: Date;
  lastActivity: Date;
  userAgent?: string;
  ipAddress?: string;
}
