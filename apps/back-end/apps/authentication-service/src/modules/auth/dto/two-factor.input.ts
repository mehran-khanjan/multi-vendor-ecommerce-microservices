// src/modules/auth/dto/two-factor.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, Length, IsOptional } from 'class-validator';

@InputType()
export class VerifyTwoFactorInput {
  @Field()
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code: string;
}

@InputType()
export class DisableTwoFactorInput {
  @Field()
  @IsString()
  @Length(6, 6)
  code: string;

  @Field()
  @IsString()
  password: string;
}
