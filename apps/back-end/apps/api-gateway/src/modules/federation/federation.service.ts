// src/federation/federation.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { SubgraphConfig } from '@config/services.config';
import { ServiceHealthStatus } from '@common/interfaces';

@Injectable()
export class FederationService implements OnModuleInit {
  private readonly logger = new Logger(FederationService.name);
  private readonly subgraphs: SubgraphConfig[];
  private readonly healthTimeout: number;
  private healthCache: Map<string, ServiceHealthStatus> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.subgraphs = this.configService.get('services.subgraphs', []);
    this.healthTimeout = this.configService.get(
      'app.health.subgraphTimeout',
      5000,
    );
  }

  async onModuleInit() {
    // Initial health check
    await this.checkAllSubgraphsHealth();

    // Periodic health checks
    setInterval(() => {
      this.checkAllSubgraphsHealth().catch((err) => {
        this.logger.error('Periodic health check failed', err);
      });
    }, 30000);
  }

  /**
   * Check health of all subgraphs
   */
  async checkAllSubgraphsHealth(): Promise<ServiceHealthStatus[]> {
    const healthChecks = this.subgraphs.map((subgraph) =>
      this.checkSubgraphHealth(subgraph),
    );

    const results = await Promise.all(healthChecks);

    // Update cache
    results.forEach((result) => {
      this.healthCache.set(result.name, result);
    });

    return results;
  }

  /**
   * Check health of a single subgraph
   */
  async checkSubgraphHealth(
    subgraph: SubgraphConfig,
  ): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    const baseUrl = subgraph.url.replace('/graphql', '');

    try {
      // Try health endpoint first
      await firstValueFrom(
        this.httpService
          .get(`${baseUrl}${subgraph.healthPath}`, {
            timeout: this.healthTimeout,
          })
          .pipe(timeout(this.healthTimeout)),
      );

      return {
        name: subgraph.name,
        url: subgraph.url,
        status: 'healthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (healthError) {
      // Fallback to GraphQL introspection
      try {
        await firstValueFrom(
          this.httpService
            .post(
              subgraph.url,
              { query: '{ __typename }' },
              { timeout: this.healthTimeout },
            )
            .pipe(timeout(this.healthTimeout)),
        );

        return {
          name: subgraph.name,
          url: subgraph.url,
          status: 'healthy',
          latency: Date.now() - startTime,
          lastChecked: new Date(),
        };
      } catch (gqlError) {
        this.logger.warn(
          `Subgraph ${subgraph.name} is unhealthy: ${gqlError.message}`,
        );

        return {
          name: subgraph.name,
          url: subgraph.url,
          status: 'unhealthy',
          latency: Date.now() - startTime,
          lastChecked: new Date(),
          error: gqlError.message,
        };
      }
    }
  }

  /**
   * Get cached health status
   */
  getCachedHealth(): ServiceHealthStatus[] {
    return Array.from(this.healthCache.values());
  }

  /**
   * Check if all services are healthy
   */
  isHealthy(): boolean {
    const statuses = this.getCachedHealth();
    return statuses.length > 0 && statuses.every((s) => s.status === 'healthy');
  }

  /**
   * Get unhealthy services
   */
  getUnhealthyServices(): ServiceHealthStatus[] {
    return this.getCachedHealth().filter((s) => s.status !== 'healthy');
  }
}
