// src/modules/payments/entities/payment.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType, Directive, Float } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod', // Cash on delivery
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('payments')
export class Payment extends BaseEntity {
  @Field()
  @Column({ name: 'order_id' })
  @Index()
  orderId: string;

  @Field()
  @Column({ name: 'customer_id' })
  @Index()
  customerId: string;

  @Field({ nullable: true })
  @Column({ name: 'payment_card_id', nullable: true })
  paymentCardId?: string;

  @Field(() => Float)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Field()
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Field()
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @Field()
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  method: PaymentMethod;

  @Field({ nullable: true })
  @Column({ name: 'transaction_id', nullable: true })
  @Index()
  transactionId?: string;

  @Field({ nullable: true })
  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse?: Record<string, any>;

  @Field({ nullable: true })
  @Column({ name: 'failure_reason', nullable: true })
  failureReason?: string;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'refunded_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  refundedAmount?: number;

  @Field({ nullable: true })
  @Column({ name: 'refund_reason', nullable: true })
  refundReason?: string;

  @Field({ nullable: true })
  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
