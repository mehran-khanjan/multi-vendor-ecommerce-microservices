// src/modules/roles/dto/create-permission.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

@InputType()
export class CreatePermissionInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  resource: string;

  @Field()
  @IsString()
  @IsIn(['create', 'read', 'update', 'delete', 'manage'])
  action: string;

  @Field({ nullable: true, defaultValue: 'any' })
  @IsOptional()
  @IsString()
  @IsIn(['own', 'any', 'tenant'])
  scope?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
