// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { SubgraphHealthIndicator } from './indicators/subgraph-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { FederationModule } from '@federation/federation.module';

@Module({
  imports: [TerminusModule, HttpModule, FederationModule],
  controllers: [HealthController],
  providers: [SubgraphHealthIndicator, RedisHealthIndicator],
  exports: [SubgraphHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
