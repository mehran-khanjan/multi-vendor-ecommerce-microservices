// src/modules/vendor-products/dto/add-vendor-product.input.ts
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VendorProductStatus } from '../entities/vendor-product.entity';

@InputType()
export class VendorVariantInput {
  @Field()
  @IsUUID()
  variantId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorSku?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class AddVendorProductInput {
  @Field()
  @IsUUID()
  productId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @Field({ nullable: true, defaultValue: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorSku?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  handlingTime?: string;

  @Field(() => [VendorVariantInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorVariantInput)
  variants?: VendorVariantInput[];
}
