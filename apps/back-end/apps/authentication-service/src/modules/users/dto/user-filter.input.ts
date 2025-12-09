// src/modules/users/dto/user-filter.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { UserStatus } from '../entities/user.entity';

@InputType()
export class UserFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vendorId?: string;
}
