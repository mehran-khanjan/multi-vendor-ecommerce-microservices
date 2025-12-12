// src/common/guards/ws-throttle.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { RedisService } from '@modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { SocketWithAuth } from '../interfaces';
import { REDIS_KEYS, REDIS_TTL } from '@config/redis.config';

@Injectable()
export class WsThrottleGuard implements CanActivate {
  private readonly logger = new Logger(WsThrottleGuard.name);
  private readonly ttl: number;
  private readonly limit: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = this.configService.get<number>('rateLimit.ttl');
    this.limit = this.configService.get<number>('rateLimit.limit');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<SocketWithAuth>();

    if (!client.user) {
      return true; // Let WsAuthGuard handle this
    }

    const key = `${REDIS_KEYS.RATE_LIMIT}${client.user.id}`;
    const current = await this.redisService.incr(key);

    if (current === 1) {
      await this.redisService.expire(key, this.ttl);
    }

    if (current > this.limit) {
      this.logger.warn(`Rate limit exceeded for user: ${client.user.id}`);
      throw new WsException('Rate limit exceeded');
    }

    return true;
  }
}
