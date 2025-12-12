// src/modules/variants/entities/variant-option.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Variant } from './variant.entity';

@ObjectType()
@Entity('variant_options')
export class VariantOption extends BaseEntity {
  @Column({ name: 'variant_id' })
  @Index()
  variantId: string;

  @Field()
  @Column()
  name: string; // e.g., "Color", "Size"

  @Field()
  @Column()
  value: string; // e.g., "Red", "XL"

  @Field()
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ManyToOne(() => Variant, (variant) => variant.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;
}
