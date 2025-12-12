// src/modules/categories/entities/category.entity.ts
import {
  Entity,
  Column,
  Index,
  Tree,
  TreeParent,
  TreeChildren,
  OneToMany,
} from 'typeorm';
import { Field, ObjectType, Directive } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from '@modules/products/entities/product.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('categories')
@Tree('materialized-path')
export class Category extends BaseEntity {
  @Field()
  @Column()
  @Index()
  name: string;

  @Field()
  @Column({ unique: true })
  @Index()
  slug: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  @Column({ name: 'icon_name', nullable: true })
  iconName?: string;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field()
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Field()
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Field({ nullable: true })
  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @Field({ nullable: true })
  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  // Relations
  @Field(() => Category, { nullable: true })
  @TreeParent()
  parent?: Category;

  @Field(() => [Category], { nullable: true })
  @TreeChildren()
  children?: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
}
