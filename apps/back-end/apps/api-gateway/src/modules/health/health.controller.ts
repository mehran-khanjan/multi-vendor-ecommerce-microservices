// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { SubgraphHealthIndicator } from './indicators/subgraph-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { FederationService } from '@federation/federation.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly subgraphHealth: SubgraphHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly federationService: FederationService,
  ) {}

  /**
   * Comprehensive health check
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Memory check (heap should be under 500MB)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // Disk check (storage should have at least 10% free)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),

      // Redis check
      () => this.redisHealth.isHealthy('redis'),

      // Subgraphs check
      () => this.subgraphHealth.isHealthy('subgraphs'),
    ]);
  }

  /**
   * Simple liveness probe
   */
  @Get('live')
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe (checks if gateway can serve traffic)
   */
  @Get('ready')
  async readiness(): Promise<{
    status: string;
    timestamp: string;
    services: Array<{
      name: string;
      status: string;
      latency?: number;
    }>;
  }> {
    const services = await this.federationService.checkAllSubgraphsHealth();
    const allHealthy = services.every((s) => s.status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      services: services.map((s) => ({
        name: s.name,
        status: s.status,
        latency: s.latency,
      })),
    };
  }

  /**
   * Detailed status endpoint
   */
  @Get('status')
  async status(): Promise<{
    status: string;
    uptime: number;
    timestamp: string;
    version: string;
    environment: string;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    services: any[];
  }> {
    const services = this.federationService.getCachedHealth();
    const memoryUsage = process.memoryUsage();
    const allHealthy = services.every((s) => s.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        ),
      },
      services: services.map((s) => ({
        name: s.name,
        url: s.url,
        status: s.status,
        latency: s.latency,
        lastChecked: s.lastChecked,
        error: s.error,
      })),
    };
  }
}
