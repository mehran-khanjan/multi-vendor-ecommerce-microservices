// src/config/rabbitmq.config.ts
export const EXCHANGES = {
  NOTIFICATIONS: 'notifications',
  NOTIFICATIONS_DLX: 'notifications.dlx',
} as const;

export const QUEUES = {
  VENDOR_ORDERS: 'notifications.vendor.orders',
  VENDOR_INVENTORY: 'notifications.vendor.inventory',
  CUSTOMER_ORDERS: 'notifications.customer.orders',
  ADMIN: 'notifications.admin',
  DEAD_LETTER: 'notifications.dead-letter',
} as const;

export const ROUTING_KEYS = {
  VENDOR_ORDER_CREATED: 'vendor.order.created',
  VENDOR_ORDER_CANCELLED: 'vendor.order.cancelled',
  VENDOR_ORDER_ITEM_STATUS: 'vendor.order.item.status',
  VENDOR_LOW_STOCK: 'vendor.inventory.low_stock',
  CUSTOMER_ORDER_CONFIRMED: 'customer.order.confirmed',
  CUSTOMER_ORDER_SHIPPED: 'customer.order.shipped',
  CUSTOMER_ORDER_DELIVERED: 'customer.order.delivered',
  ADMIN_ALL: 'admin.#',
} as const;

export const MESSAGE_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_ITEM_STATUS_UPDATED: 'ORDER_ITEM_STATUS_UPDATED',
  LOW_STOCK_ALERT: 'LOW_STOCK_ALERT',
  NEW_REVIEW: 'NEW_REVIEW',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
} as const;
