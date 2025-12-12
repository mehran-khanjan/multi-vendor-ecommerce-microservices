// src/modules/consumers/consumers.module.ts
import { Module } from '@nestjs/common';
import { OrderConsumer } from './order.consumer';
import { InventoryConsumer } from './inventory.consumer';
import { GatewaysModule } from '@modules/gateways/gateways.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [GatewaysModule, NotificationsModule],
  providers: [OrderConsumer, InventoryConsumer],
  exports: [OrderConsumer, InventoryConsumer],
})
export class ConsumersModule {}
