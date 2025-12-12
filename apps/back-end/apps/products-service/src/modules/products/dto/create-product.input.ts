// src/modules/products/dto/create-product.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, ProductStatus } from '../entities/product.entity';

@InputType()
export class ProductImageInput {
  @Field()
  @IsString()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  altText?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true, defaultValue: 'physical' })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @Field()
  @IsUUID()
  categoryId: string;

  // Admin only fields
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  basePrice: number;

  @Field({ nullable: true, defaultValue: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  weightUnit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images?: ProductImageInput[];
}
