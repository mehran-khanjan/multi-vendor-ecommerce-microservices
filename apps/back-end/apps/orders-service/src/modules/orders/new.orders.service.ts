// order-service/src/modules/orders/orders.service.ts (updated methods)

import { OrderEventsService } from '@modules/events/order-events.service';

@Injectable()
export class OrdersService {
  // ... existing constructor with added OrderEventsService
  constructor(
    // ... existing dependencies
    private readonly orderEventsService: OrderEventsService,
  ) {}

  // Update createOrder method to publish events
  async createOrder(
    input: CreateOrderInput,
    user: UserContext,
  ): Promise<Order> {
    // ... existing order creation logic

    // After successful order creation and payment
    if (payment.status === PaymentStatus.COMPLETED) {
      // ... existing code

      // Publish order created event
      const createdOrder = await this.ordersRepository.findById(order.id);
      await this.orderEventsService.publishOrderCreated(createdOrder);

      this.logger.log(
        `Order created and confirmed: ${order.orderNumber} for customer ${user.id}`,
      );
    }

    return this.ordersRepository.findById(order.id);
  }

  // Update cancelOrder method to publish events
  async cancelOrder(
    id: string,
    reason: string,
    user: UserContext,
  ): Promise<Order> {
    const order = await this.getOrderById(id, user);

    // ... existing cancellation logic

    // Publish order cancelled event
    const cancelledOrder = await this.ordersRepository.findById(id);
    await this.orderEventsService.publishOrderCancelled(
      cancelledOrder,
      reason,
      order.paymentStatus === OrderPaymentStatus.PAID
        ? 'processing'
        : undefined,
    );

    this.logger.log(`Order cancelled: ${order.orderNumber} by ${user.id}`);

    return cancelledOrder;
  }

  // Update updateOrderItemStatus method to publish events
  async updateOrderItemStatus(
    itemId: string,
    input: UpdateOrderItemStatusInput,
    user: UserContext,
  ): Promise<OrderItem> {
    const orderItem = await this.ordersRepository.findOrderItemById(itemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    const previousStatus = orderItem.status;

    // ... existing update logic

    // Publish event
    const order = await this.ordersRepository.findById(orderItem.orderId);
    const updatedItem = await this.ordersRepository.findOrderItemById(itemId);

    await this.orderEventsService.publishOrderItemStatusUpdated(
      order,
      updatedItem,
      previousStatus,
      input.status,
    );

    return updatedItem;
  }

  // Update updateOrderStatus method to publish events
  async updateOrderStatus(
    id: string,
    input: UpdateOrderStatusInput,
    user: UserContext,
  ): Promise<Order> {
    // ... existing validation and update logic

    const previousStatus = order.status;

    // ... existing update logic

    // Publish event
    const updatedOrder = await this.ordersRepository.findById(id);
    await this.orderEventsService.publishOrderStatusUpdated(
      updatedOrder,
      previousStatus,
      input.status,
    );

    return updatedOrder;
  }
}
