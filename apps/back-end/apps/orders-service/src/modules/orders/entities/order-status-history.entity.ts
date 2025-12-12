// src/modules/orders/entities/order-status-history.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';
import { OrderStatus } from '../enums/order-status.enum';

@ObjectType()
@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @Field()
  @Column({ name: 'order_id' })
  @Index()
  orderId: string;

  @Field(() => OrderStatus)
  @Column({
    name: 'from_status',
    type: 'enum',
    enum: OrderStatus,
    nullable: true,
  })
  fromStatus?: OrderStatus;

  @Field(() => OrderStatus)
  @Column({
    name: 'to_status',
    type: 'enum',
    enum: OrderStatus,
  })
  toStatus: OrderStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reason?: string;

  @Field({ nullable: true })
  @Column({ name: 'changed_by', nullable: true })
  changedBy?: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => Order, (order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
