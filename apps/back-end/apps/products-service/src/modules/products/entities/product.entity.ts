// src/modules/products/entities/product.entity.ts
import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  Field,
  ObjectType,
  Directive,
  Float,
  Int,
  HideField,
} from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Category } from '@modules/categories/entities/category.entity';
import { Variant } from '@modules/variants/entities/variant.entity';
import { ProductImage } from './product-image.entity';
import { VendorProduct } from '@modules/vendor-products/entities/vendor-product.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('products')
export class Product extends BaseEntity {
  @Field()
  @Column()
  @Index()
  name: string;

  @Field()
  @Column({ unique: true })
  @Index()
  slug: string;

  @Field({ nullable: true })
  @Column({ name: 'short_description', nullable: true })
  shortDescription?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Field()
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status: ProductStatus;

  // SKU - Only visible to Admin
  // Using custom field resolver for access control
  @Field({ nullable: true, description: 'Only visible to admin' })
  @Column({ nullable: true, unique: true })
  @Index()
  sku?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  barcode?: string;

  // Cost price - Only visible to Admin
  @Field(() => Float, { nullable: true, description: 'Only visible to admin' })
  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costPrice?: number;

  // Base price (MSRP)
  @Field(() => Float)
  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  basePrice: number;

  @Field()
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Field()
  @Column({ name: 'is_published', default: false })
  @Index()
  isPublished: boolean;

  @Field()
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Field({ nullable: true })
  @Column({ name: 'weight_unit', default: 'kg' })
  weightUnit?: string;

  @Field({ nullable: true })
  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @Field({ nullable: true })
  @Column({ name: 'published_at', nullable: true })
  publishedAt?: Date;

  @Field()
  @Column({ name: 'category_id' })
  @Index()
  categoryId: string;

  // Relations
  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Field(() => [Variant], { nullable: true })
  @OneToMany(() => Variant, (variant) => variant.product, { cascade: true })
  variants?: Variant[];

  @Field(() => [ProductImage], { nullable: true })
  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images?: ProductImage[];

  @Field(() => [VendorProduct], { nullable: true })
  @OneToMany(() => VendorProduct, (vp) => vp.product)
  vendorProducts?: VendorProduct[];
}
