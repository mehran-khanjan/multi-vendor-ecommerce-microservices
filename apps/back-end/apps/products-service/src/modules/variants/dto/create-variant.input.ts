// src/modules/variants/dto/create-variant.input.ts
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class VariantOptionInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value: string;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

@InputType()
export class CreateVariantInput {
  @Field()
  @IsUUID()
  productId: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  basePrice: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field(() => [VariantOptionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionInput)
  options?: VariantOptionInput[];
}
