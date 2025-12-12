// src/common/guards/ws-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { SocketWithAuth } from '../interfaces';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithAuth>();

    if (!client.user) {
      this.logger.warn(`Unauthorized WebSocket access attempt: ${client.id}`);
      throw new WsException('Unauthorized');
    }

    return true;
  }
}
