// src/modules/variants/dto/update-variant.input.ts
import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateVariantInput } from './create-variant.input';

@InputType()
export class UpdateVariantInput extends PartialType(
  OmitType(CreateVariantInput, ['productId'] as const),
) {}
