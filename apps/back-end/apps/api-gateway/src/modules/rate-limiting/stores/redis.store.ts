// src/rate-limiting/stores/redis.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisStore {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async increment(key: string, ttl: number): Promise<number> {
    const current = (await this.cache.get<number>(key)) || 0;
    const newValue = current + 1;
    await this.cache.set(key, newValue, ttl);
    return newValue;
  }

  async get(key: string): Promise<number> {
    return (await this.cache.get<number>(key)) || 0;
  }

  async reset(key: string): Promise<void> {
    await this.cache.del(key);
  }
}
