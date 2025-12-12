// src/modules/vendor-products/dto/update-vendor-product.input.ts
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { VendorProductStatus } from '../entities/vendor-product.entity';

@InputType()
export class UpdateVendorProductInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(VendorProductStatus)
  status?: VendorProductStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @Field({ nullable: true })
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
}
