// order-service/src/modules/events/order-events.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { v4 as uuidv4 } from 'uuid';

export const ROUTING_KEYS = {
  VENDOR_ORDER_CREATED: 'vendor.order.created',
  VENDOR_ORDER_CANCELLED: 'vendor.order.cancelled',
  VENDOR_ORDER_ITEM_STATUS: 'vendor.order.item.status',
  CUSTOMER_ORDER_CONFIRMED: 'customer.order.confirmed',
  CUSTOMER_ORDER_SHIPPED: 'customer.order.shipped',
  CUSTOMER_ORDER_DELIVERED: 'customer.order.delivered',
  CUSTOMER_ORDER_CANCELLED: 'customer.order.cancelled',
  ADMIN_ORDER_HIGH_VALUE: 'admin.order.high_value',
} as const;

export const MESSAGE_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_ITEM_STATUS_UPDATED: 'ORDER_ITEM_STATUS_UPDATED',
} as const;

@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  /**
   * Publish order created event - sends to each vendor separately
   */
  async publishOrderCreated(order: Order): Promise<void> {
    // Group items by vendor
    const itemsByVendor = this.groupItemsByVendor(order.items);

    for (const [vendorId, items] of Object.entries(itemsByVendor)) {
      const vendorTotal = items.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0,
      );

      const message = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ORDER_CREATED,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          vendorId,
          customerId: order.customerId,
          items: items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            variantId: item.variantId,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          subtotal: vendorTotal,
          totalAmount: vendorTotal,
          currency: order.currency,
          shippingAddress: {
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
          },
          createdAt: order.createdAt.toISOString(),
        },
        metadata: {
          source: 'order-service',
          version: '1.0',
          correlationId: order.id,
        },
      };

      await this.rabbitMQService.publish(
        ROUTING_KEYS.VENDOR_ORDER_CREATED,
        message,
      );

      this.logger.log(
        `Order created event published for vendor ${vendorId}: ${order.orderNumber}`,
      );
    }
  }

  /**
   * Publish order cancelled event
   */
  async publishOrderCancelled(
    order: Order,
    reason: string,
    refundStatus?: string,
  ): Promise<void> {
    // Notify each vendor
    const itemsByVendor = this.groupItemsByVendor(order.items);

    for (const [vendorId, items] of Object.entries(itemsByVendor)) {
      const message = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ORDER_CANCELLED,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          vendorId,
          customerId: order.customerId,
          reason,
          refundStatus,
          items: items.map((item) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
          })),
          cancelledAt: order.cancelledAt?.toISOString(),
        },
        metadata: {
          source: 'order-service',
          version: '1.0',
          correlationId: order.id,
        },
      };

      await this.rabbitMQService.publish(
        ROUTING_KEYS.VENDOR_ORDER_CANCELLED,
        message,
      );
    }

    // Notify customer
    const customerMessage = {
      id: uuidv4(),
      type: MESSAGE_TYPES.ORDER_CANCELLED,
      timestamp: new Date().toISOString(),
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        reason,
        refundStatus,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
      },
      metadata: {
        source: 'order-service',
        version: '1.0',
        correlationId: order.id,
      },
    };

    await this.rabbitMQService.publish(
      ROUTING_KEYS.CUSTOMER_ORDER_CANCELLED,
      customerMessage,
    );

    this.logger.log(`Order cancelled events published: ${order.orderNumber}`);
  }

  /**
   * Publish order item status updated event
   */
  async publishOrderItemStatusUpdated(
    order: Order,
    orderItem: OrderItem,
    previousStatus: string,
    newStatus: string,
  ): Promise<void> {
    // Notify vendor
    const vendorMessage = {
      id: uuidv4(),
      type: MESSAGE_TYPES.ORDER_ITEM_STATUS_UPDATED,
      timestamp: new Date().toISOString(),
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderItemId: orderItem.id,
        vendorId: orderItem.vendorId,
        customerId: order.customerId,
        productName: orderItem.productName,
        variantName: orderItem.variantName,
        previousStatus,
        newStatus,
        trackingNumber: orderItem.trackingNumber,
        trackingUrl: orderItem.trackingUrl,
        updatedAt: new Date().toISOString(),
      },
      metadata: {
        source: 'order-service',
        version: '1.0',
        correlationId: order.id,
      },
    };

    await this.rabbitMQService.publish(
      ROUTING_KEYS.VENDOR_ORDER_ITEM_STATUS,
      vendorMessage,
    );

    // Notify customer for specific status changes
    if (['shipped', 'delivered'].includes(newStatus)) {
      const routingKey =
        newStatus === 'shipped'
          ? ROUTING_KEYS.CUSTOMER_ORDER_SHIPPED
          : ROUTING_KEYS.CUSTOMER_ORDER_DELIVERED;

      const customerMessage = {
        id: uuidv4(),
        type: MESSAGE_TYPES.ORDER_STATUS_UPDATED,
        timestamp: new Date().toISOString(),
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          productName: orderItem.productName,
          newStatus,
          trackingNumber: orderItem.trackingNumber,
          trackingUrl: orderItem.trackingUrl,
          updatedAt: new Date().toISOString(),
        },
        metadata: {
          source: 'order-service',
          version: '1.0',
          correlationId: order.id,
        },
      };

      await this.rabbitMQService.publish(routingKey, customerMessage);
    }

    this.logger.log(
      `Order item status updated event published: ${order.orderNumber} - ${orderItem.productName} -> ${newStatus}`,
    );
  }

  /**
   * Publish order status updated event
   */
  async publishOrderStatusUpdated(
    order: Order,
    previousStatus: string,
    newStatus: string,
  ): Promise<void> {
    const message = {
      id: uuidv4(),
      type: MESSAGE_TYPES.ORDER_STATUS_UPDATED,
      timestamp: new Date().toISOString(),
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        previousStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      },
      metadata: {
        source: 'order-service',
        version: '1.0',
        correlationId: order.id,
      },
    };

    // Determine routing key based on status
    let routingKey: string;
    switch (newStatus) {
      case 'confirmed':
        routingKey = ROUTING_KEYS.CUSTOMER_ORDER_CONFIRMED;
        break;
      case 'shipped':
        routingKey = ROUTING_KEYS.CUSTOMER_ORDER_SHIPPED;
        break;
      case 'delivered':
        routingKey = ROUTING_KEYS.CUSTOMER_ORDER_DELIVERED;
        break;
      default:
        routingKey = `customer.order.${newStatus}`;
    }

    await this.rabbitMQService.publish(routingKey, message);

    this.logger.log(
      `Order status updated event published: ${order.orderNumber} -> ${newStatus}`,
    );
  }

  private groupItemsByVendor(items: OrderItem[]): Record<string, OrderItem[]> {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.vendorId]) {
          acc[item.vendorId] = [];
        }
        acc[item.vendorId].push(item);
        return acc;
      },
      {} as Record<string, OrderItem[]>,
    );
  }
}
