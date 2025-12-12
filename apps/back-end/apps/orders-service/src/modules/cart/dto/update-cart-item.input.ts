// src/modules/cart/dto/update-cart-item.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNumber, Min, Max } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => Int)
  @IsNumber()
  @Min(0)
  @Max(999)
  quantity: number;
}
