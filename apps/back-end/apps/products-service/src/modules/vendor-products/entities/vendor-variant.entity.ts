// src/modules/vendor-products/entities/vendor-variant.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Field, ObjectType, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Variant } from '@modules/variants/entities/variant.entity';
import { VendorProduct } from './vendor-product.entity';

@ObjectType()
@Entity('vendor_variants')
@Unique(['vendorProductId', 'variantId'])
export class VendorVariant extends BaseEntity {
  @Field()
  @Column({ name: 'vendor_product_id' })
  @Index()
  vendorProductId: string;

  @Field()
  @Column({ name: 'variant_id' })
  @Index()
  variantId: string;

  @Field()
  @Column({ name: 'vendor_id' })
  @Index()
  vendorId: string;

  @Field(() => Float)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  price: number;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  compareAtPrice?: number;

  @Field(() => Int, { description: 'Only visible to vendor and admin' })
  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ name: 'vendor_sku', nullable: true })
  vendorSku?: string;

  // Relations
  @Field(() => Variant)
  @ManyToOne(() => Variant, (variant) => variant.vendorVariants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @ManyToOne(() => VendorProduct, (vp) => vp.vendorVariants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendor_product_id' })
  vendorProduct: VendorProduct;
}
