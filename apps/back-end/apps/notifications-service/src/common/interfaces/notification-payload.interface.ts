// src/common/interfaces/notification-payload.interface.ts
import {
  NotificationType,
  NotificationPriority,
  RecipientType,
} from '../enums';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientType: RecipientType;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  metadata?: {
    source: string;
    version: string;
    correlationId?: string;
    timestamp: string;
  };
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  vendorId: string;
  customerId: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    city: string;
    state: string;
    country: string;
  };
  createdAt: string;
}

export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  updatedAt: string;
}

export interface OrderItemStatusPayload {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productName: string;
  previousStatus: string;
  newStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  updatedAt: string;
}

export interface LowStockPayload {
  vendorProductId: string;
  productId: string;
  productName: string;
  variantName?: string;
  currentStock: number;
  threshold: number;
}

export interface RabbitMQMessage<T = any> {
  id: string;
  type: string;
  timestamp: string;
  payload: T;
  metadata: {
    source: string;
    version: string;
    correlationId: string;
    retryCount?: number;
  };
}
