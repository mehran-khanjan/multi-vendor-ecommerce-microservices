// src/modules/roles/dto/create-role.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';

@InputType()
export class CreateRoleInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
