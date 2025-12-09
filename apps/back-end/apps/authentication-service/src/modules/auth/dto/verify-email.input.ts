// src/modules/auth/dto/verify-email.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
}
