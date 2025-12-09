// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-store';

import configuration from '@config/configuration';
import { FederationModule } from '@federation/federation.module';
import { AuthModule } from '@auth/auth.module';
import { HealthModule } from '@health/health.module';
import { RateLimitingModule } from '@rate-limiting/rate-limiting.module';
import { CachingModule } from '@caching/caching.module';
import { MetricsModule } from '@metrics/metrics.module';

import {
  CorrelationIdMiddleware,
  RequestContextMiddleware,
} from '@common/middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      cache: true,
    }),

    // HTTP Client
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
        ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'gateway:',
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    FederationModule,
    AuthModule,
    HealthModule,
    RateLimitingModule,
    CachingModule,
    MetricsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestContextMiddleware)
      .forRoutes('*');
  }
}
