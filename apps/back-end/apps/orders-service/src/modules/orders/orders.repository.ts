// src/modules/orders/orders.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderFilterInput } from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
  ) {}

  async findById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'statusHistory'],
    });
  }

  async findByCustomerId(
    customerId: string,
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    const where: any = { customerId };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter.fromDate && filter.toDate) {
      where.createdAt = Between(
        new Date(filter.fromDate),
        new Date(filter.toDate),
      );
    } else if (filter.fromDate) {
      where.createdAt = MoreThanOrEqual(new Date(filter.fromDate));
    } else if (filter.toDate) {
      where.createdAt = LessThanOrEqual(new Date(filter.toDate));
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [orders, totalItems] = await this.orderRepository.findAndCount({
      where,
      relations: ['items'],
      skip,
      take: pagination.limit,
      order: {
        [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC',
      },
    });

    const meta: PaginationMeta = {
      totalItems,
      itemCount: orders.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { orders, meta };
  }

  async findByVendorId(
    vendorId: string,
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item', 'item.vendorId = :vendorId', {
        vendorId,
      })
      .leftJoinAndSelect('order.items', 'allItems')
      .where('allItems.vendorId = :vendorId', { vendorId });

    if (filter.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: filter.status,
      });
    }

    if (filter.fromDate) {
      queryBuilder.andWhere('order.createdAt >= :fromDate', {
        fromDate: new Date(filter.fromDate),
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere('order.createdAt <= :toDate', {
        toDate: new Date(filter.toDate),
      });
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [orders, totalItems] = await queryBuilder
      .skip(skip)
      .take(pagination.limit)
      .orderBy(
        `order.${pagination.sortBy || 'createdAt'}`,
        pagination.sortOrder || 'DESC',
      )
      .getManyAndCount();

    const meta: PaginationMeta = {
      totalItems,
      itemCount: orders.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { orders, meta };
  }

  async findAll(
    filter: OrderFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ orders: Order[]; meta: PaginationMeta }> {
    const where: any = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter.fromDate && filter.toDate) {
      where.createdAt = Between(
        new Date(filter.fromDate),
        new Date(filter.toDate),
      );
    } else if (filter.fromDate) {
      where.createdAt = MoreThanOrEqual(new Date(filter.fromDate));
    } else if (filter.toDate) {
      where.createdAt = LessThanOrEqual(new Date(filter.toDate));
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [orders, totalItems] = await this.orderRepository.findAndCount({
      where,
      relations: ['items'],
      skip,
      take: pagination.limit,
      order: {
        [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC',
      },
    });

    const meta: PaginationMeta = {
      totalItems,
      itemCount: orders.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { orders, meta };
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.orderRepository.create(orderData);
    return this.orderRepository.save(order);
  }

  async update(id: string, updates: Partial<Order>): Promise<void> {
    await this.orderRepository.update(id, updates);
  }

  async findOrderItemById(id: string): Promise<OrderItem | null> {
    return this.orderItemRepository.findOne({
      where: { id },
      relations: ['order'],
    });
  }

  async updateOrderItem(
    id: string,
    updates: Partial<OrderItem>,
  ): Promise<void> {
    await this.orderItemRepository.update(id, updates);
  }

  async addStatusHistory(
    history: Partial<OrderStatusHistory>,
  ): Promise<OrderStatusHistory> {
    const record = this.statusHistoryRepository.create(history);
    return this.statusHistoryRepository.save(record);
  }

  async generateOrderNumber(prefix: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Get count of orders today for sequence
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.orderRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');

    return `${prefix}-${year}${month}${day}-${sequence}`;
  }

  async getOrderStats(
    vendorId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    let queryBuilder = this.orderRepository.createQueryBuilder('order');

    if (vendorId) {
      queryBuilder = queryBuilder.innerJoin(
        'order.items',
        'item',
        'item.vendorId = :vendorId',
        { vendorId },
      );
    }

    if (startDate) {
      queryBuilder = queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder = queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate,
      });
    }

    const totalOrders = await queryBuilder.getCount();

    const pendingOrders = await queryBuilder
      .clone()
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
        ],
      })
      .getCount();

    const completedOrders = await queryBuilder
      .clone()
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getCount();

    const cancelledOrders = await queryBuilder
      .clone()
      .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
      .getCount();

    const revenueResult = await queryBuilder
      .clone()
      .andWhere('order.status NOT IN (:...excludeStatuses)', {
        excludeStatuses: [
          OrderStatus.CANCELLED,
          OrderStatus.REFUNDED,
          OrderStatus.FAILED,
        ],
      })
      .select('SUM(order.totalAmount)', 'total')
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
    };
  }
}
