// src/modules/orders/orders.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersRepository } from './orders.repository';
import { Order, ShippingAddress } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderPaymentStatus } from './enums/payment-status.enum';
import { OrderItemStatus } from './enums/order-item-status.enum';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  UpdateOrderItemStatusInput,
  OrderFilterInput,
} from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';
import { CartService } from '@modules/cart/cart.service';
import { PaymentsService } from '@modules/payments/payments.service';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { AuthGrpcClient, ProductGrpcClient } from '@grpc/clients';
import { UserContext } from '@common/interfaces';
import {
  PaymentStatus,
  PaymentMethod,
} from '@modules/payments/entities/payment.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly orderNumberPrefix: string;
  private readonly stockReservationTtl: number;

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartService: CartService,
    private readonly paymentsService: PaymentsService,
    private readonly authService: AuthorizationService,
    private readonly authGrpcClient: AuthGrpcClient,
    private readonly productGrpcClient: ProductGrpcClient,
    private readonly configService: ConfigService,
  ) {
    this.orderNumberPrefix = this.configService.get<string>(
      'order.orderNumberPrefix',
    );
    this.stockReservationTtl = this.configService.get<number>(
      'order.stockReservationTtl',
    );
  }

  // ==========================================
  // Customer Methods
  // ==========================================

  /**
   * Create a new order from cart
   */
  async createOrder(
    input: CreateOrderInput,
    user: UserContext,
  ): Promise<Order> {
    // Step 1: Validate cart
    const cartValidation = await this.cartService.validateCartForCheckout(user);

    if (!cartValidation.valid) {
      const issueMessages = cartValidation.issues
        .map((i) => `${i.message}`)
        .join('; ');
      throw new BadRequestException(`Cart validation failed: ${issueMessages}`);
    }

    const cart = cartValidation.cart;

    // Step 2: Get shipping address from auth service
    const addressResponse = await this.authGrpcClient.getUserAddress(
      user.id,
      input.shippingAddressId,
    );

    if (!addressResponse.success || !addressResponse.address) {
      throw new BadRequestException('Shipping address not found');
    }

    const address = addressResponse.address;
    const shippingAddress: ShippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    // Step 3: Validate payment card
    const paymentCard = await this.paymentsService.getCardById(
      input.paymentCardId,
      user,
    );

    if (paymentCard.isExpired) {
      throw new BadRequestException('Payment card has expired');
    }

    // Step 4: Reserve stock
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stockItems = cart.items.map((item) => ({
      vendorProductId: item.vendorProductId,
      vendorVariantId: item.vendorVariantId,
      quantity: item.quantity,
    }));

    const reservationResponse = await this.productGrpcClient.reserveStock(
      reservationId,
      stockItems,
      this.stockReservationTtl,
    );

    if (!reservationResponse.success) {
      throw new BadRequestException(
        `Failed to reserve stock: ${reservationResponse.error}`,
      );
    }

    try {
      // Step 5: Calculate totals
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const taxAmount = subtotal * 0.1; // 10% tax (should be configurable)
      const shippingAmount = this.calculateShipping(cart.items);
      const discountAmount = 0; // TODO: Apply coupon if provided
      const totalAmount =
        subtotal + taxAmount + shippingAmount - discountAmount;

      // Step 6: Generate order number
      const orderNumber = await this.ordersRepository.generateOrderNumber(
        this.orderNumberPrefix,
      );

      // Step 7: Create order
      const order = await this.ordersRepository.create({
        customerId: user.id,
        orderNumber,
        status: OrderStatus.PENDING,
        paymentStatus: OrderPaymentStatus.PENDING,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        currency: cart.currency || 'USD',
        shippingAddress,
        billingAddressId: input.billingAddressId,
        notes: input.notes,
        cartId: cart.id,
        stockReservationId: reservationId,
        items: cart.items.map((item) => ({
          vendorId: item.vendorId,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.productSlug,
          variantId: item.variantId,
          variantName: item.variantName,
          vendorProductId: item.vendorProductId,
          vendorVariantId: item.vendorVariantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          status: OrderItemStatus.PENDING,
          imageUrl: item.imageUrl,
        })),
      });

      // Step 8: Process payment
      const payment = await this.paymentsService.processPayment(
        {
          orderId: order.id,
          paymentCardId: input.paymentCardId,
          amount: totalAmount,
          currency: cart.currency || 'USD',
          method: PaymentMethod.CARD,
        },
        user,
      );

      if (payment.status === PaymentStatus.COMPLETED) {
        // Payment successful
        await this.ordersRepository.update(order.id, {
          paymentId: payment.id,
          paymentStatus: OrderPaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
          confirmedAt: new Date(),
        });

        // Confirm stock deduction
        await this.productGrpcClient.confirmStockDeduction(reservationId);

        // Mark cart as converted
        await this.cartService.markCartAsConverted(cart.id);

        // Add status history
        await this.ordersRepository.addStatusHistory({
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CONFIRMED,
          changedBy: 'system',
          metadata: { paymentId: payment.id },
        });

        this.logger.log(
          `Order created and confirmed: ${order.orderNumber} for customer ${user.id}`,
        );
      } else {
        // Payment failed
        await this.ordersRepository.update(order.id, {
          paymentId: payment.id,
          paymentStatus: OrderPaymentStatus.FAILED,
          status: OrderStatus.FAILED,
        });

        // Release stock reservation
        await this.productGrpcClient.releaseStock(reservationId);

        throw new BadRequestException(
          `Payment failed: ${payment.failureReason || 'Unknown error'}`,
        );
      }

      return this.ordersRepository.findById(order.id);
    } catch (error) {
      // Release stock on any error
      await this.productGrpcClient.releaseStock(reservationId);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string, user: UserContext): Promise<Order> {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (!this.canAccessOrder(order, user)) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(
    orderNumber: string,
    user: UserContext,
  ): Promise<Order> {
    const order = await this.ordersRepository.findByOrderNumber(orderNumber);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canAccessOrder(order, user)) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  /**
   * Get customer's orders
   */
  async getMyOrders(
    user: UserContext,
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    return this.ordersRepository.findByCustomerId(user.id, filter, pagination);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    id: string,
    reason: string,
    user: UserContext,
  ): Promise<Order> {
    const order = await this.getOrderById(id, user);

    // Only the customer or admin can cancel
    if (!this.authService.canAccessUserData(user, order.customerId)) {
      throw new ForbiddenException('Access denied');
    }

    // Check if order can be cancelled
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled in ${order.status} status`,
      );
    }

    const previousStatus = order.status;

    // Update order status
    await this.ordersRepository.update(id, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    // Release stock if reserved
    if (order.stockReservationId) {
      await this.productGrpcClient.releaseStock(order.stockReservationId);
    }

    // Process refund if paid
    if (order.paymentStatus === OrderPaymentStatus.PAID && order.paymentId) {
      await this.paymentsService.processRefund(
        order.paymentId,
        order.totalAmount,
        `Order cancelled: ${reason}`,
        user,
      );

      await this.ordersRepository.update(id, {
        paymentStatus: OrderPaymentStatus.REFUNDED,
      });
    }

    // Update all items to cancelled
    for (const item of order.items) {
      await this.ordersRepository.updateOrderItem(item.id, {
        status: OrderItemStatus.CANCELLED,
      });
    }

    // Add status history
    await this.ordersRepository.addStatusHistory({
      orderId: id,
      fromStatus: previousStatus,
      toStatus: OrderStatus.CANCELLED,
      reason,
      changedBy: user.id,
    });

    this.logger.log(`Order cancelled: ${order.orderNumber} by ${user.id}`);

    return this.ordersRepository.findById(id);
  }

  // ==========================================
  // Vendor Methods
  // ==========================================

  /**
   * Get orders containing vendor's items
   */
  async getVendorOrders(
    user: UserContext,
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    if (!user.vendorId && !this.authService.isAdmin(user)) {
      throw new ForbiddenException('Access denied');
    }

    const vendorId = filter.vendorId || user.vendorId;

    if (!this.authService.canAccessVendorData(user, vendorId)) {
      throw new ForbiddenException('Access denied');
    }

    return this.ordersRepository.findByVendorId(vendorId, filter, pagination);
  }

  /**
   * Update order item status (for vendors)
   */
  async updateOrderItemStatus(
    itemId: string,
    input: UpdateOrderItemStatusInput,
    user: UserContext,
  ): Promise<OrderItem> {
    const orderItem = await this.ordersRepository.findOrderItemById(itemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    // Check vendor access
    if (!this.authService.canAccessVendorData(user, orderItem.vendorId)) {
      throw new ForbiddenException('Access denied');
    }

    // Validate status transition
    if (!this.isValidItemStatusTransition(orderItem.status, input.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${orderItem.status} to ${input.status}`,
      );
    }

    const updates: Partial<OrderItem> = {
      status: input.status,
    };

    if (input.trackingNumber) {
      updates.trackingNumber = input.trackingNumber;
    }

    if (input.trackingUrl) {
      updates.trackingUrl = input.trackingUrl;
    }

    if (input.status === OrderItemStatus.SHIPPED) {
      updates.shippedAt = new Date();
    }

    if (input.status === OrderItemStatus.DELIVERED) {
      updates.deliveredAt = new Date();
    }

    await this.ordersRepository.updateOrderItem(itemId, updates);

    // Check if all items have the same status to update order status
    await this.updateOrderStatusFromItems(orderItem.orderId);

    this.logger.log(
      `Order item ${itemId} status updated to ${input.status} by vendor ${user.vendorId}`,
    );

    return this.ordersRepository.findOrderItemById(itemId);
  }

  /**
   * Get vendor order statistics
   */
  async getVendorOrderStats(
    user: UserContext,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    if (!user.vendorId && !this.authService.isAdmin(user)) {
      throw new ForbiddenException('Access denied');
    }

    return this.ordersRepository.getOrderStats(
      user.vendorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ==========================================
  // Admin Methods
  // ==========================================

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
    user: UserContext,
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    return this.ordersRepository.findAll(filter, pagination);
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(
    id: string,
    input: UpdateOrderStatusInput,
    user: UserContext,
  ): Promise<Order> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;

    // Validate status transition
    if (!this.isValidOrderStatusTransition(previousStatus, input.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${previousStatus} to ${input.status}`,
      );
    }

    const updates: Partial<Order> = {
      status: input.status,
    };

    // Set timestamps based on status
    switch (input.status) {
      case OrderStatus.CONFIRMED:
        updates.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        updates.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updates.deliveredAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updates.cancelledAt = new Date();
        updates.cancellationReason = input.reason;
        break;
    }

    await this.ordersRepository.update(id, updates);

    // Add status history
    await this.ordersRepository.addStatusHistory({
      orderId: id,
      fromStatus: previousStatus,
      toStatus: input.status,
      reason: input.reason,
      changedBy: user.id,
    });

    this.logger.log(
      `Order ${order.orderNumber} status updated: ${previousStatus} -> ${input.status} by admin ${user.id}`,
    );

    return this.ordersRepository.findById(id);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private canAccessOrder(order: Order, user: UserContext): boolean {
    // Admin can access all orders
    if (this.authService.isAdmin(user)) {
      return true;
    }

    // Customer can access their own orders
    if (order.customerId === user.id) {
      return true;
    }

    // Vendor can access orders containing their items
    if (user.vendorId) {
      return (
        order.items?.some((item) => item.vendorId === user.vendorId) || false
      );
    }

    return false;
  }

  private calculateShipping(items: any[]): number {
    // Simple shipping calculation
    // In production, integrate with shipping providers
    const baseRate = 5.99;
    const perItemRate = 1.0;
    const freeShippingThreshold = 50;

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    if (subtotal >= freeShippingThreshold) {
      return 0;
    }

    return baseRate + items.length * perItemRate;
  }

  private isValidOrderStatusTransition(
    from: OrderStatus,
    to: OrderStatus,
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.FAILED,
      ],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.FAILED]: [OrderStatus.PENDING],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private isValidItemStatusTransition(
    from: OrderItemStatus,
    to: OrderItemStatus,
  ): boolean {
    const validTransitions: Record<OrderItemStatus, OrderItemStatus[]> = {
      [OrderItemStatus.PENDING]: [
        OrderItemStatus.CONFIRMED,
        OrderItemStatus.CANCELLED,
      ],
      [OrderItemStatus.CONFIRMED]: [
        OrderItemStatus.PROCESSING,
        OrderItemStatus.CANCELLED,
      ],
      [OrderItemStatus.PROCESSING]: [
        OrderItemStatus.READY_TO_SHIP,
        OrderItemStatus.CANCELLED,
      ],
      [OrderItemStatus.READY_TO_SHIP]: [OrderItemStatus.SHIPPED],
      [OrderItemStatus.SHIPPED]: [OrderItemStatus.DELIVERED],
      [OrderItemStatus.DELIVERED]: [OrderItemStatus.RETURNED],
      [OrderItemStatus.CANCELLED]: [],
      [OrderItemStatus.RETURNED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private async updateOrderStatusFromItems(orderId: string): Promise<void> {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) return;

    const itemStatuses = order.items.map((item) => item.status);

    // Check if all items are in the same status
    const allDelivered = itemStatuses.every(
      (s) => s === OrderItemStatus.DELIVERED,
    );
    const allShipped = itemStatuses.every(
      (s) => s === OrderItemStatus.SHIPPED || s === OrderItemStatus.DELIVERED,
    );
    const allCancelled = itemStatuses.every(
      (s) => s === OrderItemStatus.CANCELLED,
    );

    let newStatus: OrderStatus | null = null;

    if (allDelivered) {
      newStatus = OrderStatus.DELIVERED;
    } else if (allShipped) {
      newStatus = OrderStatus.SHIPPED;
    } else if (allCancelled) {
      newStatus = OrderStatus.CANCELLED;
    }

    if (newStatus && newStatus !== order.status) {
      await this.ordersRepository.update(orderId, { status: newStatus });

      await this.ordersRepository.addStatusHistory({
        orderId,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: 'system',
        metadata: { reason: 'Auto-updated based on item statuses' },
      });
    }
  }
}
