// src/modules/orders/orders.resolver.ts (continued)
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveReference,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  UpdateOrderItemStatusInput,
  OrderFilterInput,
} from './dto';
import {
  PaginationInput,
  PaginationMeta,
  createPaginatedResponse,
} from '@common/dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import { RequirePermissions, CurrentUser } from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
class PaginatedOrdersResponse extends createPaginatedResponse(Order) {}

@ObjectType()
class OrderStats {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Int)
  pendingOrders: number;

  @Field(() => Int)
  completedOrders: number;

  @Field(() => Int)
  cancelledOrders: number;

  @Field(() => Float)
  totalRevenue: number;
}

@Resolver(() => Order)
@UseGuards(AuthGuard, PermissionsGuard)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  // ==========================================
  // CUSTOMER QUERIES
  // ==========================================

  @RequirePermissions({ action: Action.VIEW_ORDER, subject: Subject.ORDER })
  @Query(() => PaginatedOrdersResponse, { name: 'myOrders' })
  async getMyOrders(
    @CurrentUser() user: UserContext,
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: Order[]; meta: PaginationMeta }> {
    const result = await this.ordersService.getMyOrders(
      user,
      filter || {},
      pagination || { page: 1, limit: 20 },
    );
    return { items: result.orders, meta: result.meta };
  }

  @RequirePermissions({ action: Action.VIEW_ORDER, subject: Subject.ORDER })
  @Query(() => Order, { name: 'order' })
  async getOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<Order> {
    return this.ordersService.getOrderById(id, user);
  }

  @RequirePermissions({ action: Action.VIEW_ORDER, subject: Subject.ORDER })
  @Query(() => Order, { name: 'orderByNumber' })
  async getOrderByNumber(
    @Args('orderNumber') orderNumber: string,
    @CurrentUser() user: UserContext,
  ): Promise<Order> {
    return this.ordersService.getOrderByNumber(orderNumber, user);
  }

  // ==========================================
  // CUSTOMER MUTATIONS
  // ==========================================

  @RequirePermissions({ action: Action.PLACE_ORDER, subject: Subject.ORDER })
  @Mutation(() => Order)
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() user: UserContext,
  ): Promise<Order> {
    return this.ordersService.createOrder(input, user);
  }

  @RequirePermissions({ action: Action.CANCEL_ORDER, subject: Subject.ORDER })
  @Mutation(() => Order)
  async cancelOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @CurrentUser() user: UserContext,
  ): Promise<Order> {
    return this.ordersService.cancelOrder(id, reason, user);
  }

  // ==========================================
  // VENDOR QUERIES
  // ==========================================

  @RequirePermissions({
    action: Action.VIEW_VENDOR_ORDERS,
    subject: Subject.ORDER,
  })
  @Query(() => PaginatedOrdersResponse, { name: 'vendorOrders' })
  async getVendorOrders(
    @CurrentUser() user: UserContext,
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: Order[]; meta: PaginationMeta }> {
    const result = await this.ordersService.getVendorOrders(
      user,
      filter || {},
      pagination || { page: 1, limit: 20 },
    );
    return { items: result.orders, meta: result.meta };
  }

  @RequirePermissions({
    action: Action.VIEW_VENDOR_ORDERS,
    subject: Subject.ORDER,
  })
  @Query(() => OrderStats, { name: 'vendorOrderStats' })
  async getVendorOrderStats(
    @CurrentUser() user: UserContext,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<OrderStats> {
    return this.ordersService.getVendorOrderStats(user, startDate, endDate);
  }

  // ==========================================
  // VENDOR MUTATIONS
  // ==========================================

  @RequirePermissions({
    action: Action.FULFILL_ORDER,
    subject: Subject.ORDER_ITEM,
  })
  @Mutation(() => OrderItem)
  async updateOrderItemStatus(
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('input') input: UpdateOrderItemStatusInput,
    @CurrentUser() user: UserContext,
  ): Promise<OrderItem> {
    return this.ordersService.updateOrderItemStatus(itemId, input, user);
  }

  @RequirePermissions({
    action: Action.SHIP_ORDER,
    subject: Subject.ORDER_ITEM,
  })
  @Mutation(() => OrderItem)
  async shipOrderItem(
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('trackingNumber') trackingNumber: string,
    @Args('trackingUrl', { nullable: true }) trackingUrl?: string,
    @CurrentUser() user?: UserContext,
  ): Promise<OrderItem> {
    return this.ordersService.updateOrderItemStatus(
      itemId,
      {
        status: 'shipped' as any,
        trackingNumber,
        trackingUrl,
      },
      user,
    );
  }

  // ==========================================
  // ADMIN QUERIES
  // ==========================================

  @RequirePermissions({
    action: Action.VIEW_ALL_ORDERS,
    subject: Subject.ORDER,
  })
  @Query(() => PaginatedOrdersResponse, { name: 'adminOrders' })
  async getAdminOrders(
    @CurrentUser() user: UserContext,
    @Args('filter', { nullable: true }) filter?: OrderFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: Order[]; meta: PaginationMeta }> {
    const result = await this.ordersService.getAllOrders(
      filter || {},
      pagination || { page: 1, limit: 20 },
      user,
    );
    return { items: result.orders, meta: result.meta };
  }

  @RequirePermissions({
    action: Action.VIEW_ALL_ORDERS,
    subject: Subject.ORDER,
  })
  @Query(() => OrderStats, { name: 'adminOrderStats' })
  async getAdminOrderStats(
    @CurrentUser() user: UserContext,
    @Args('vendorId', { nullable: true }) vendorId?: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<OrderStats> {
    // For admin, we can optionally filter by vendor
    const userContext = vendorId ? { ...user, vendorId } : user;
    return this.ordersService.getVendorOrderStats(
      { ...user, vendorId: vendorId || undefined } as UserContext,
      startDate,
      endDate,
    );
  }

  // ==========================================
  // ADMIN MUTATIONS
  // ==========================================

  @RequirePermissions({
    action: Action.UPDATE_ORDER_STATUS,
    subject: Subject.ORDER,
  })
  @Mutation(() => Order)
  async updateOrderStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateOrderStatusInput,
    @CurrentUser() user: UserContext,
  ): Promise<Order> {
    return this.ordersService.updateOrderStatus(id, input, user);
  }

  // ==========================================
  // Federation
  // ==========================================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<Order> {
    // For federation, we need a way to get order without full auth check
    // This is called from other services
    const order = await this.ordersService['ordersRepository'].findById(
      reference.id,
    );
    return order;
  }
}
