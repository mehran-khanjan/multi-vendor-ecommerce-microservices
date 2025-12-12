// src/modules/vendor-products/entities/vendor-product.entity.ts
import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Field, ObjectType, Directive, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from '@modules/products/entities/product.entity';
import { VendorVariant } from './vendor-variant.entity';

export enum VendorProductStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('vendor_products')
@Unique(['vendorId', 'productId'])
export class VendorProduct extends BaseEntity {
  @Field()
  @Column({ name: 'vendor_id' })
  @Index()
  vendorId: string;

  @Field()
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Field()
  @Column({
    type: 'enum',
    enum: VendorProductStatus,
    default: VendorProductStatus.DRAFT,
  })
  @Index()
  status: VendorProductStatus;

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

  // Purchase price - Only visible to vendor owner and admin
  @Field(() => Float, {
    nullable: true,
    description: 'Only visible to vendor owner',
  })
  @Column({
    name: 'purchase_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  purchasePrice?: number;

  @Field()
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Field()
  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Field(() => Int, { description: 'Only visible to vendor and admin' })
  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Field(() => Int, { description: 'Only visible to vendor and admin' })
  @Column({ name: 'low_stock_threshold', default: 5 })
  lowStockThreshold: number;

  @Field()
  @Column({ name: 'track_inventory', default: true })
  trackInventory: boolean;

  @Field()
  @Column({ name: 'allow_backorder', default: false })
  allowBackorder: boolean;

  @Field({ nullable: true })
  @Column({ name: 'vendor_sku', nullable: true })
  vendorSku?: string;

  @Field({ nullable: true })
  @Column({ name: 'handling_time', nullable: true })
  handlingTime?: string; // e.g., "1-2 business days"

  // Relations
  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.vendorProducts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Field(() => [VendorVariant], { nullable: true })
  @OneToMany(() => VendorVariant, (vv) => vv.vendorProduct, { cascade: true })
  vendorVariants?: VendorVariant[];

  // Computed fields
  @Field()
  get isInStock(): boolean {
    if (!this.trackInventory) return true;
    return this.stockQuantity > 0 || this.allowBackorder;
  }

  @Field()
  get isLowStock(): boolean {
    if (!this.trackInventory) return false;
    return (
      this.stockQuantity <= this.lowStockThreshold && this.stockQuantity > 0
    );
  }
}
