// src/health/indicators/redis-health.indicator.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const testKey = 'health:ping';
      const testValue = Date.now().toString();

      // Write test
      await this.cacheManager.set(testKey, testValue, 5000);

      // Read test
      const readValue = await this.cacheManager.get<string>(testKey);

      if (readValue !== testValue) {
        throw new Error('Redis read/write mismatch');
      }

      // Delete test
      await this.cacheManager.del(testKey);

      return this.getStatus(key, true, { status: 'connected' });
    } catch (error) {
      const result = this.getStatus(key, false, {
        status: 'disconnected',
        error: error.message,
      });
      throw new HealthCheckError('Redis health check failed', result);
    }
  }
}
