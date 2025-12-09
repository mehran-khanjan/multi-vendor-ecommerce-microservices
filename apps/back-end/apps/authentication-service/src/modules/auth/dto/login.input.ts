// src/modules/auth/dto/login.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(1)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  backupCode?: string;
}
