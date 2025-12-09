// src/rate-limiting/rate-limiting.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitingService } from './rate-limiting.service';
import { RedisStore } from './stores/redis.store';
import { MemoryStore } from './stores/memory.store';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RateLimitingService, RedisStore, MemoryStore],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}
