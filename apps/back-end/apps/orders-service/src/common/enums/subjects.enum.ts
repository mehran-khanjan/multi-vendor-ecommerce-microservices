// src/common/enums/subject.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum Subject {
  ALL = 'all',
  CART = 'cart',
  CART_ITEM = 'cart_item',
  ORDER = 'order',
  ORDER_ITEM = 'order_item',
  PAYMENT = 'payment',
  PAYMENT_CARD = 'payment_card',
  REFUND = 'refund',
}

registerEnumType(Subject, { name: 'Subject' });
