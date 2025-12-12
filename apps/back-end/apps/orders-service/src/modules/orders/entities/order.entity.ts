// src/modules/orders/entities/order.entity.ts
import { Entity, Column, Index, OneToMany } from 'typeorm';
import { Field, ObjectType, Directive, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderPaymentStatus } from '../enums/payment-status.enum';

@ObjectType()
export class ShippingAddress {
  @Field()
  fullName: string;

  @Field()
  phone: string;

  @Field()
  addressLine1: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  postalCode: string;

  @Field()
  country: string;
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('orders')
export class Order extends BaseEntity {
  @Field()
  @Column({ name: 'customer_id' })
  @Index()
  customerId: string;

  @Field()
  @Column({ name: 'order_number', unique: true })
  @Index()
  orderNumber: string;

  @Field(() => OrderStatus)
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index()
  status: OrderStatus;

  @Field(() => OrderPaymentStatus)
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.PENDING,
  })
  paymentStatus: OrderPaymentStatus;

  @Field({ nullable: true })
  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @Field(() => Float)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  @Field(() => Float)
  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Field(() => Float)
  @Column({
    name: 'shipping_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  shippingAmount: number;

  @Field(() => Float)
  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Field(() => Float)
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalAmount: number;

  @Field()
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Field(() => ShippingAddress)
  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: ShippingAddress;

  @Field({ nullable: true })
  @Column({ name: 'billing_address_id', nullable: true })
  billingAddressId?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason?: string;

  @Field({ nullable: true })
  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'shipped_at', nullable: true })
  shippedAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'cart_id', nullable: true })
  cartId?: string;

  @Field({ nullable: true })
  @Column({ name: 'stock_reservation_id', nullable: true })
  stockReservationId?: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @Field(() => [OrderStatusHistory], { nullable: true })
  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  statusHistory?: OrderStatusHistory[];

  // Computed fields
  @Field(() => Int)
  get itemCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  @Field(() => Int)
  get uniqueVendorCount(): number {
    const vendorIds = new Set(this.items?.map((item) => item.vendorId) || []);
    return vendorIds.size;
  }
}
