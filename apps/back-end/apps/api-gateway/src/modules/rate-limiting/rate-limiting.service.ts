// src/rate-limiting/rate-limiting.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private readonly enabled: boolean;
  private readonly windowMs: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.enabled = this.configService.get('rateLimit.enabled', true);
    this.windowMs = this.configService.get('rateLimit.windowMs', 60000);
    this.keyPrefix = 'ratelimit:';
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number = this.windowMs,
  ): Promise<RateLimitResult> {
    if (!this.enabled) {
      return {
        allowed: true,
        info: {
          limit,
          current: 0,
          remaining: limit,
          resetTime: Date.now() + windowMs,
        },
      };
    }

    const key = `${this.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get current count
      const data = await this.cache.get<{ count: number; startTime: number }>(
        key,
      );

      let count = 1;
      let startTime = now;

      if (data) {
        if (data.startTime > windowStart) {
          // Within window
          count = data.count + 1;
          startTime = data.startTime;
        }
        // Otherwise, window expired - reset
      }

      // Update count
      await this.cache.set(key, { count, startTime }, windowMs);

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = startTime + windowMs;

      if (!allowed) {
        this.logger.debug(
          `Rate limit exceeded for ${identifier}: ${count}/${limit}`,
        );
      }

      return {
        allowed,
        info: {
          limit,
          current: count,
          remaining,
          resetTime,
        },
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`);
      // Fail open on cache errors
      return {
        allowed: true,
        info: {
          limit,
          current: 0,
          remaining: limit,
          resetTime: Date.now() + windowMs,
        },
      };
    }
  }

  /**
   * Get rate limit for user based on role
   */
  getLimitForUser(roles: string[]): number {
    const limits = this.configService.get('rateLimit.limits', {
      anonymous: 30,
      customer: 100,
      vendor: 200,
      admin: 500,
    });

    if (roles.includes('super_admin') || roles.includes('admin')) {
      return limits.admin;
    }

    if (roles.includes('vendor') || roles.includes('vendor_owner')) {
      return limits.vendor;
    }

    if (roles.length > 0) {
      return limits.customer;
    }

    return limits.anonymous;
  }

  /**
   * Get operation-specific rate limit
   */
  getOperationLimit(
    operation: string,
  ): { limit: number; windowMs: number } | null {
    const operationLimits = this.configService.get(
      'rateLimit.operationLimits',
      {},
    );
    return operationLimits[operation] || null;
  }

  /**
   * Build rate limit key
   */
  buildKey(userId?: string, ip?: string, operation?: string): string {
    const parts: string[] = [];

    if (operation) {
      parts.push(`op:${operation}`);
    }

    if (userId) {
      parts.push(`user:${userId}`);
    } else if (ip) {
      parts.push(`ip:${ip}`);
    } else {
      parts.push('unknown');
    }

    return parts.join(':');
  }

  /**
   * Reset rate limit for identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = `${this.keyPrefix}${identifier}`;
    await this.cache.del(key);
  }

  /**
   * Check if identifier is whitelisted
   */
  isWhitelisted(userId?: string, ip?: string): boolean {
    const whitelist = this.configService.get('rateLimit.whitelist', {
      ips: [],
      userIds: [],
    });

    if (userId && whitelist.userIds.includes(userId)) {
      return true;
    }

    if (ip && whitelist.ips.includes(ip)) {
      return true;
    }

    return false;
  }
}
