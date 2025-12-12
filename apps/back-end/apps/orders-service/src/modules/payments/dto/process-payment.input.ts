// src/modules/payments/dto/process-payment.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

@InputType()
export class ProcessPaymentInput {
  @Field()
  @IsUUID()
  orderId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  paymentCardId?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field({ nullable: true, defaultValue: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
