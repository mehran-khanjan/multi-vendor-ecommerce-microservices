// src/modules/orders/orders.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersRepository } from './orders.repository';
import { OrdersGrpcController } from './orders.grpc.controller';
import { Order, OrderItem, OrderStatusHistory } from './entities';
import { CartModule } from '@modules/cart/cart.module';
import { PaymentsModule } from '@modules/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory]),
    forwardRef(() => CartModule),
    PaymentsModule,
  ],
  providers: [OrdersService, OrdersResolver, OrdersRepository],
  controllers: [OrdersGrpcController],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
