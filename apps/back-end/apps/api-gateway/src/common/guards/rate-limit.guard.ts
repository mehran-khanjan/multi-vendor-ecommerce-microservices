// src/common/guards/rate-limit.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GatewayException } from '@common/exceptions';
import { HEADERS } from '@common/constants';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly enabled: boolean;
  private readonly windowMs: number;
  private readonly limits: Record<string, number>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.enabled = this.configService.get<boolean>('rateLimit.enabled', true);
    this.windowMs = this.configService.get<number>('rateLimit.windowMs', 60000);
    this.limits = this.configService.get('rateLimit.limits', {
      anonymous: 30,
      customer: 100,
      vendor: 200,
      admin: 500,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req, res } = ctx.getContext();
    const gatewayContext = req.context;

    // Build rate limit key
    const key = this.buildKey(gatewayContext);

    // Get current count
    const current = await this.getCurrentCount(key);

    // Determine limit based on user role
    const limit = this.getLimit(gatewayContext);

    // Calculate remaining
    const remaining = Math.max(0, limit - current - 1);

    // Set rate limit headers
    res.setHeader(HEADERS.RATE_LIMIT_LIMIT, limit);
    res.setHeader(HEADERS.RATE_LIMIT_REMAINING, remaining);
    res.setHeader(
      HEADERS.RATE_LIMIT_RESET,
      Math.ceil((Date.now() + this.windowMs) / 1000),
    );

    // Check if rate limited
    if (current >= limit) {
      this.logger.warn(
        `[${gatewayContext.requestId}] Rate limit exceeded for ${key}`,
      );
      throw GatewayException.rateLimited(Math.ceil(this.windowMs / 1000));
    }

    // Increment counter
    await this.incrementCount(key);

    return true;
  }

  private buildKey(context: any): string {
    if (context?.user?.id) {
      return `ratelimit:user:${context.user.id}`;
    }
    return `ratelimit:ip:${context?.clientIp || 'unknown'}`;
  }

  private getLimit(context: any): number {
    if (!context?.isAuthenticated) {
      return this.limits.anonymous;
    }

    const roles = context.user?.roles || [];

    if (roles.includes('admin') || roles.includes('super_admin')) {
      return this.limits.admin;
    }

    if (roles.includes('vendor') || roles.includes('vendor_owner')) {
      return this.limits.vendor;
    }

    return this.limits.customer;
  }

  private async getCurrentCount(key: string): Promise<number> {
    const count = await this.cacheManager.get<number>(key);
    return count || 0;
  }

  private async incrementCount(key: string): Promise<void> {
    const current = await this.getCurrentCount(key);
    await this.cacheManager.set(key, current + 1, this.windowMs);
  }
}
