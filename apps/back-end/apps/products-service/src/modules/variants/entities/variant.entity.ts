// src/modules/variants/entities/variant.entity.ts
import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Field, ObjectType, Directive, Float, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from '@modules/products/entities/product.entity';
import { VariantOption } from './variant-option.entity';
import { VendorVariant } from '@modules/vendor-products/entities/vendor-variant.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('variants')
export class Variant extends BaseEntity {
  @Field()
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true, description: 'Only visible to admin' })
  @Column({ nullable: true, unique: true })
  @Index()
  sku?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  barcode?: string;

  @Field(() => Float, { nullable: true, description: 'Only visible to admin' })
  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costPrice?: number;

  @Field(() => Float)
  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  basePrice: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Int)
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Field({ nullable: true })
  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  // Relations
  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Field(() => [VariantOption], { nullable: true })
  @OneToMany(() => VariantOption, (option) => option.variant, {
    cascade: true,
    eager: true,
  })
  options?: VariantOption[];

  @OneToMany(() => VendorVariant, (vv) => vv.variant)
  vendorVariants?: VendorVariant[];
}
