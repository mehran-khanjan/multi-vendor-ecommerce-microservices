import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { FederationService } from '@federation/federation.service';

@Injectable()
export class SubgraphHealthIndicator extends HealthIndicator {
  constructor(private readonly federationService: FederationService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const services = await this.federationService.checkAllSubgraphsHealth();
    const unhealthyServices = services.filter((s) => s.status !== 'healthy');
    const isHealthy = unhealthyServices.length === 0;

    const result = this.getStatus(key, isHealthy, {
      services: services.map((s) => ({
        name: s.name,
        status: s.status,
        latency: s.latency,
      })),
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError(
      `Subgraphs unhealthy: ${unhealthyServices.map((s) => s.name).join(', ')}`,
      result,
    );
  }
}
