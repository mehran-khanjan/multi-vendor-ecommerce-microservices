// src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { ProductsRepository } from './products.repository';
import { Product, ProductImage } from './entities';
import { CategoriesModule } from '@modules/categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    CategoriesModule,
  ],
  providers: [ProductsService, ProductsResolver, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
