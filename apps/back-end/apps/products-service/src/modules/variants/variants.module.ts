// src/modules/variants/variants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantsService } from './variants.service';
import { VariantsResolver } from './variants.resolver';
import { Variant, VariantOption } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Variant, VariantOption])],
  providers: [VariantsService, VariantsResolver],
  exports: [VariantsService],
})
export class VariantsModule {}
