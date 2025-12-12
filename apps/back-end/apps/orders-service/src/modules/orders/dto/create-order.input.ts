// src/modules/orders/dto/create-order.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field()
  @IsUUID()
  shippingAddressId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @Field()
  @IsUUID()
  paymentCardId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
