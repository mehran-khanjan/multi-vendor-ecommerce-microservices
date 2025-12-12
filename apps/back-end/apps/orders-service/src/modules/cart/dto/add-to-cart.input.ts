// src/modules/cart/dto/add-to-cart.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field()
  @IsString()
  productSlug: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Field()
  @IsUUID()
  vendorProductId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  vendorVariantId?: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsNumber()
  @Min(1)
  @Max(999)
  quantity: number = 1;
}
