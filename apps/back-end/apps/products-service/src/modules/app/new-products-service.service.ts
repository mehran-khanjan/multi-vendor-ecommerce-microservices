import { Injectable } from '@nestjs/common';

@Injectable()
export class NewProductsServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
