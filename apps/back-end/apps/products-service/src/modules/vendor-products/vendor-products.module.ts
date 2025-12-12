// src/modules/vendor-products/vendor-products.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorProductsService } from './vendor-products.service';
import { VendorProductsResolver } from './vendor-products.resolver';
import { VendorProduct, VendorVariant } from './entities';
import { ProductsModule } from '@modules/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorProduct, VendorVariant]),
    forwardRef(() => ProductsModule),
  ],
  providers: [VendorProductsService, VendorProductsResolver],
  exports: [VendorProductsService],
})
export class VendorProductsModule {}
