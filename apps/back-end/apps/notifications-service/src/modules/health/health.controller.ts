// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { RedisService } from '@modules/redis/redis.service';
import { ConnectionManagerService } from '@modules/gateways/connection-manager.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private rabbitMQService: RabbitMQService,
    private redisService: RedisService,
    private connectionManager: ConnectionManagerService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRabbitMQ(),
      () => this.checkRedis(),
    ]);
  }

  @Get('live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HealthCheck()
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRabbitMQ(),
      () => this.checkRedis(),
    ]);
  }

  @Get('stats')
  async stats() {
    const connectionStats = await this.connectionManager.getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      connections: connectionStats,
      rabbitmq: {
        connected: this.rabbitMQService.isReady(),
      },
    };
  }

  private async checkRabbitMQ() {
    const isHealthy = this.rabbitMQService.isReady();

    if (isHealthy) {
      return { rabbitmq: { status: 'up' } };
    }

    throw new Error('RabbitMQ is not connected');
  }

  private async checkRedis() {
    try {
      await this.redisService.getClient().ping();
      return { redis: { status: 'up' } };
    } catch (error) {
      throw new Error('Redis is not connected');
    }
  }
}
