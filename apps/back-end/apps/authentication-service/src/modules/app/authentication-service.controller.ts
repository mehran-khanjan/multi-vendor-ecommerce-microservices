import { Controller, Get } from '@nestjs/common';
import { AuthenticationServiceService } from './authentication-service.service';

@Controller()
export class AuthenticationServiceController {
  constructor(
    private readonly authenticationServiceService: AuthenticationServiceService,
  ) {}

  @Get()
  getHello(): string {
    return this.authenticationServiceService.getHello();
  }
}
