// src/modules/orders/entities/order-item.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';
import { OrderItemStatus } from '../enums/order-item-status.enum';

@ObjectType()
@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Field()
  @Column({ name: 'order_id' })
  @Index()
  orderId: string;

  @Field()
  @Column({ name: 'vendor_id' })
  @Index()
  vendorId: string;

  @Field()
  @Column({ name: 'product_id' })
  productId: string;

  @Field()
  @Column({ name: 'product_name' })
  productName: string;

  @Field()
  @Column({ name: 'product_slug' })
  productSlug: string;

  @Field({ nullable: true })
  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @Field({ nullable: true })
  @Column({ name: 'variant_name', nullable: true })
  variantName?: string;

  @Field()
  @Column({ name: 'vendor_product_id' })
  vendorProductId: string;

  @Field({ nullable: true })
  @Column({ name: 'vendor_variant_id', nullable: true })
  vendorVariantId?: string;

  @Field(() => Int)
  @Column()
  quantity: number;

  @Field(() => Float)
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice: number;

  @Field(() => Float)
  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalPrice: number;

  @Field(() => OrderItemStatus)
  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  @Index()
  status: OrderItemStatus;

  @Field({ nullable: true })
  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'tracking_url', nullable: true })
  trackingUrl?: string;

  @Field({ nullable: true })
  @Column({ name: 'shipped_at', nullable: true })
  shippedAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
