// src/modules/cart/entities/cart.entity.ts
import { Entity, Column, Index, OneToMany } from 'typeorm';
import { Field, ObjectType, Directive, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'active',
  CONVERTED = 'converted', // Converted to order
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('carts')
export class Cart extends BaseEntity {
  @Field()
  @Column({ name: 'customer_id' })
  @Index()
  customerId: string;

  @Field()
  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  @Field({ nullable: true })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Field({ nullable: true })
  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @Field({ nullable: true })
  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  // Relations
  @Field(() => [CartItem])
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  // Computed fields
  @Field(() => Int)
  get itemCount(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  @Field(() => Float)
  get subtotal(): number {
    return this.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  }
}
