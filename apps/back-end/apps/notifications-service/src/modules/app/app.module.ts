// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from '@config/configuration';
import { DatabaseModule } from '@database/database.module';
import { GrpcModule } from '@grpc/grpc.module';
import { RedisModule } from '@modules/redis/redis.module';
import { RabbitMQModule } from '@modules/rabbitmq/rabbitmq.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { GatewaysModule } from '@modules/gateways/gateways.module';
import { ConsumersModule } from '@modules/consumers/consumers.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    ScheduleModule.forRoot(),

    DatabaseModule,
    GrpcModule,
    RedisModule,
    RabbitMQModule,
    NotificationsModule,
    GatewaysModule,
    ConsumersModule,
    HealthModule,
  ],
})
export class AppModule {}
