// src/modules/vendor-products/dto/update-vendor-variant.input.ts
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class UpdateVendorVariantInput {
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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorSku?: string;
}
