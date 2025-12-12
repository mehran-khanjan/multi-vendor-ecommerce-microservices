// src/modules/products/dto/update-product.input.ts
import { InputType, PartialType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CreateProductInput } from './create-product.input';
import { ProductStatus } from '../entities/product.entity';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
