// src/modules/orders/orders.grpc.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrdersRepository } from './orders.repository';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItemStatus } from './enums/order-item-status.enum';

interface GetOrderByIdRequest {
  orderId: string;
}

interface GetOrdersByVendorRequest {
  vendorId: string;
  status?: string;
  page: number;
  limit: number;
}

interface UpdateOrderItemStatusRequest {
  orderItemId: string;
  status: string;
  vendorId: string;
}

interface GetOrderStatsRequest {
  vendorId?: string;
  startDate?: string;
  endDate?: string;
}

@Controller()
export class OrdersGrpcController {
  private readonly logger = new Logger(OrdersGrpcController.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  @GrpcMethod('OrderService', 'GetOrderById')
  async getOrderById(request: GetOrderByIdRequest) {
    try {
      const order = await this.ordersRepository.findById(request.orderId);

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      return {
        success: true,
        order: this.mapOrderToProto(order),
      };
    } catch (error) {
      this.logger.error(`GetOrderById error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('OrderService', 'GetOrdersByVendor')
  async getOrdersByVendor(request: GetOrdersByVendorRequest) {
    try {
      const filter: any = {};
      if (request.status) {
        filter.status = request.status as OrderStatus;
      }

      const result = await this.ordersRepository.findByVendorId(
        request.vendorId,
        filter,
        { page: request.page || 1, limit: request.limit || 20 },
      );

      return {
        success: true,
        orders: result.orders.map((o) => this.mapOrderToProto(o)),
        totalCount: result.meta.totalItems,
      };
    } catch (error) {
      this.logger.error(`GetOrdersByVendor error: ${error.message}`);
      return {
        success: false,
        orders: [],
        totalCount: 0,
        error: error.message,
      };
    }
  }

  @GrpcMethod('OrderService', 'UpdateOrderItemStatus')
  async updateOrderItemStatus(request: UpdateOrderItemStatusRequest) {
    try {
      const orderItem = await this.ordersRepository.findOrderItemById(
        request.orderItemId,
      );

      if (!orderItem) {
        return { success: false, error: 'Order item not found' };
      }

      if (orderItem.vendorId !== request.vendorId) {
        return { success: false, error: 'Access denied' };
      }

      await this.ordersRepository.updateOrderItem(request.orderItemId, {
        status: request.status as OrderItemStatus,
      });

      const updatedItem = await this.ordersRepository.findOrderItemById(
        request.orderItemId,
      );

      return {
        success: true,
        orderItem: this.mapOrderItemToProto(updatedItem),
      };
    } catch (error) {
      this.logger.error(`UpdateOrderItemStatus error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('OrderService', 'GetOrderStats')
  async getOrderStats(request: GetOrderStatsRequest) {
    try {
      const stats = await this.ordersRepository.getOrderStats(
        request.vendorId,
        request.startDate ? new Date(request.startDate) : undefined,
        request.endDate ? new Date(request.endDate) : undefined,
      );

      return {
        success: true,
        ...stats,
      };
    } catch (error) {
      this.logger.error(`GetOrderStats error: ${error.message}`);
      return {
        success: false,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        error: error.message,
      };
    }
  }

  private mapOrderToProto(order: any) {
    return {
      id: order.id,
      customerId: order.customerId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: parseFloat(order.subtotal),
      taxAmount: parseFloat(order.taxAmount),
      shippingAmount: parseFloat(order.shippingAmount),
      discountAmount: parseFloat(order.discountAmount),
      totalAmount: parseFloat(order.totalAmount),
      currency: order.currency,
      shippingAddress: order.shippingAddress,
      items: order.items?.map((i: any) => this.mapOrderItemToProto(i)) || [],
      createdAt: order.createdAt?.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
    };
  }

  private mapOrderItemToProto(item: any) {
    return {
      id: item.id,
      orderId: item.orderId,
      vendorId: item.vendorId,
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      vendorProductId: item.vendorProductId,
      vendorVariantId: item.vendorVariantId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice),
      status: item.status,
    };
  }
}
