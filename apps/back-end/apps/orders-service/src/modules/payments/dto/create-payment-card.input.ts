// src/modules/payments/dto/create-payment-card.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreatePaymentCardInput {
  @Field()
  @IsString()
  @MaxLength(100)
  cardHolderName: string;

  @Field()
  @IsString()
  @Length(13, 19)
  @Matches(/^\d+$/, { message: 'Card number must contain only digits' })
  cardNumber: string;

  @Field()
  @IsString()
  @Length(2, 2)
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Invalid expiry month' })
  expiryMonth: string;

  @Field()
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'Invalid expiry year' })
  expiryYear: string;

  @Field()
  @IsString()
  @Length(3, 4)
  @Matches(/^\d+$/, { message: 'CVV must contain only digits' })
  cvv: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Billing address
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingAddressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingAddressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingCity?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingState?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  billingCountry?: string;
}
