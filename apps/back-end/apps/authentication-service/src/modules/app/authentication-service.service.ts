import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
