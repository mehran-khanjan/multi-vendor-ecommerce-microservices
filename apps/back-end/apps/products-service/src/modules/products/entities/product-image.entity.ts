// src/modules/products/entities/product-image.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@ObjectType()
@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Field()
  @Column()
  url: string;

  @Field({ nullable: true })
  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Field({ nullable: true })
  @Column({ name: 'alt_text', nullable: true })
  altText?: string;

  @Field()
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Field(() => Int)
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
