// src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { GatewaysModule } from '@modules/gateways/gateways.module';

@Module({
  imports: [TerminusModule, GatewaysModule],
  controllers: [HealthController],
})
export class HealthModule {}
