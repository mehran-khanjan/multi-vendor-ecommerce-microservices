// src/common/enums/action.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum Action {
  // General CRUD
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // Cart specific
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CLEAR_CART = 'clear_cart',

  // Order specific
  PLACE_ORDER = 'place_order',
  CANCEL_ORDER = 'cancel_order',
  VIEW_ORDER = 'view_order',
  VIEW_ALL_ORDERS = 'view_all_orders',
  UPDATE_ORDER_STATUS = 'update_order_status',

  // Payment specific
  ADD_PAYMENT_CARD = 'add_payment_card',
  REMOVE_PAYMENT_CARD = 'remove_payment_card',
  VIEW_PAYMENT_CARDS = 'view_payment_cards',
  PROCESS_PAYMENT = 'process_payment',
  REFUND_PAYMENT = 'refund_payment',

  // Vendor specific
  VIEW_VENDOR_ORDERS = 'view_vendor_orders',
  FULFILL_ORDER = 'fulfill_order',
  SHIP_ORDER = 'ship_order',

  // Admin specific
  MANAGE = 'manage',
}

registerEnumType(Action, { name: 'Action' });
