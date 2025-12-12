// src/modules/gateways/gateways.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VendorGateway } from './vendor.gateway';
import { CustomerGateway } from './customer.gateway';
import { AdminGateway } from './admin.gateway';
import { ConnectionManagerService } from './connection-manager.service';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [ConfigModule, NotificationsModule],
  providers: [
    ConnectionManagerService,
    VendorGateway,
    CustomerGateway,
    AdminGateway,
  ],
  exports: [
    ConnectionManagerService,
    VendorGateway,
    CustomerGateway,
    AdminGateway,
  ],
})
export class GatewaysModule {}
