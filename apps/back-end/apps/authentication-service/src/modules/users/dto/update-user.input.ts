// src/modules/users/dto/update-user.input.ts
import { InputType, Field, PartialType, OmitType } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { CreateUserInput } from './create-user.input';
import { UserStatus } from '../entities/user.entity';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['password', 'email'] as const),
) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
