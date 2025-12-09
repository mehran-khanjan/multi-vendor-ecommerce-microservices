// src/caching/caching.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private readonly enabled: boolean;
  private readonly defaultTtl: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.enabled = this.configService.get('app.cache.enabled', true);
    this.defaultTtl = this.configService.get('app.cache.ttl', 300);
    this.keyPrefix = 'gql:';
  }

  /**
   * Generate cache key for GraphQL operation
   */
  generateKey(
    operation: string,
    variables?: Record<string, any>,
    userId?: string,
  ): string {
    const parts = [this.keyPrefix, operation];

    if (userId) {
      parts.push(`user:${userId}`);
    }

    if (variables && Object.keys(variables).length > 0) {
      const hash = crypto
        .createHash('md5')
        .update(JSON.stringify(variables))
        .digest('hex')
        .substring(0, 8);
      parts.push(hash);
    }

    return parts.join(':');
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const value = await this.cache.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const ttl = options?.ttl || this.defaultTtl;

    try {
      await this.cache.set(key, value, ttl * 1000);

      // Store tags for invalidation
      if (options?.tags) {
        for (const tag of options.tags) {
          await this.addKeyToTag(tag, key);
        }
      }

      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cache.del(key);
      this.logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.cache.get<string[]>(tagKey);

      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.cache.del(key);
        }
        await this.cache.del(tagKey);
        this.logger.debug(
          `Cache invalidated by tag: ${tag} (${keys.length} keys)`,
        );
      }
    } catch (error) {
      this.logger.error(`Cache tag invalidation error: ${error.message}`);
    }
  }

  /**
   * Add key to tag set
   */
  private async addKeyToTag(tag: string, key: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const existingKeys = (await this.cache.get<string[]>(tagKey)) || [];

    if (!existingKeys.includes(key)) {
      existingKeys.push(key);
      await this.cache.set(tagKey, existingKeys, this.defaultTtl * 2 * 1000);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.cache.reset();
      this.logger.warn('All cache cleared');
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }

  /**
   * Wrap async function with cache
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, options);
    return result;
  }
}
