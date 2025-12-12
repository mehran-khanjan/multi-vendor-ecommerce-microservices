// src/modules/orders/dto/update-order-status.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItemStatus } from '../enums/order-item-status.enum';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@InputType()
export class UpdateOrderItemStatusInput {
  @Field(() => OrderItemStatus)
  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
