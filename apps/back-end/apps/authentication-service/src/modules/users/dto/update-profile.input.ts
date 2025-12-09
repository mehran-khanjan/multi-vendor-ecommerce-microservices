// src/modules/users/dto/update-profile.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsUrl,
  IsIn,
} from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;
}

@InputType()
export class UpdateNotificationPreferencesInput {
  @Field({ nullable: true })
  @IsOptional()
  email?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  sms?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  push?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  marketing?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  orderUpdates?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  promotions?: boolean;
}
