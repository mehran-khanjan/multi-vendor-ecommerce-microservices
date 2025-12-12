// src/modules/orders/enums/payment-status.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum OrderPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

registerEnumType(OrderPaymentStatus, { name: 'OrderPaymentStatus' });
