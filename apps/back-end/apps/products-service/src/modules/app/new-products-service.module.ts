import { Module } from '@nestjs/common';
import { NewProductsServiceController } from './new-products-service.controller';
import { NewProductsServiceService } from './new-products-service.service';

@Module({
  imports: [],
  controllers: [NewProductsServiceController],
  providers: [NewProductsServiceService],
})
export class NewProductsServiceModule {}
