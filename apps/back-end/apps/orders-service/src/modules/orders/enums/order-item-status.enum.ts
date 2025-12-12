// src/modules/orders/enums/order-item-status.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum OrderItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

registerEnumType(OrderItemStatus, { name: 'OrderItemStatus' });
