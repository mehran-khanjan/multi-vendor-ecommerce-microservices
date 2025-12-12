// src/modules/cart/entities/cart-item.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Field, ObjectType, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Cart } from './cart.entity';

@ObjectType()
@Entity('cart_items')
@Unique(['cartId', 'vendorProductId', 'vendorVariantId'])
export class CartItem extends BaseEntity {
  @Field()
  @Column({ name: 'cart_id' })
  @Index()
  cartId: string;

  @Field()
  @Column({ name: 'product_id' })
  productId: string;

  @Field()
  @Column({ name: 'product_slug' })
  productSlug: string;

  @Field()
  @Column({ name: 'product_name' })
  productName: string;

  @Field({ nullable: true })
  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @Field({ nullable: true })
  @Column({ name: 'variant_name', nullable: true })
  variantName?: string;

  @Field()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @Field()
  @Column({ name: 'vendor_product_id' })
  vendorProductId: string;

  @Field({ nullable: true })
  @Column({ name: 'vendor_variant_id', nullable: true })
  vendorVariantId?: string;

  @Field(() => Int)
  @Column({ default: 1 })
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
    name: 'original_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  originalPrice?: number;

  @Field({ nullable: true })
  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  // Computed fields
  @Field(() => Float)
  get totalPrice(): number {
    return this.unitPrice * this.quantity;
  }

  @Field(() => Float, { nullable: true })
  get savings(): number | null {
    if (this.originalPrice && this.originalPrice > this.unitPrice) {
      return (this.originalPrice - this.unitPrice) * this.quantity;
    }
    return null;
  }
}
