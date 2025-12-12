import { Controller, Get } from '@nestjs/common';
import { NewProductsServiceService } from './new-products-service.service';

@Controller()
export class NewProductsServiceController {
  constructor(
    private readonly newProductsServiceService: NewProductsServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.newProductsServiceService.getHello();
  }
}
