// src/modules/orders/dto/order-filter.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderPaymentStatus } from '../enums/payment-status.enum';

@InputType()
export class OrderFilterInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => OrderPaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  paymentStatus?: OrderPaymentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
