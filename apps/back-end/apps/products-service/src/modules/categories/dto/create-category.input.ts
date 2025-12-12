// src/modules/categories/dto/create-category.input.ts
import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  IsUrl,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  iconName?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string;
}
