import { Test, TestingModule } from '@nestjs/testing';
import { NewProductsServiceController } from './new-products-service.controller';
import { NewProductsServiceService } from './new-products-service.service';

describe('NewProductsServiceController', () => {
  let newProductsServiceController: NewProductsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NewProductsServiceController],
      providers: [NewProductsServiceService],
    }).compile();

    newProductsServiceController = app.get<NewProductsServiceController>(
      NewProductsServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(newProductsServiceController.getHello()).toBe('Hello World!');
    });
  });
});
