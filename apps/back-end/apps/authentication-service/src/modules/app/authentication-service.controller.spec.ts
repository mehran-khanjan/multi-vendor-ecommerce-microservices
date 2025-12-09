import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationServiceController } from './authentication-service.controller';
import { AuthenticationServiceService } from './authentication-service.service';

describe('AuthenticationServiceController', () => {
  let authenticationServiceController: AuthenticationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationServiceController],
      providers: [AuthenticationServiceService],
    }).compile();

    authenticationServiceController = app.get<AuthenticationServiceController>(
      AuthenticationServiceController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(authenticationServiceController.getHello()).toBe('Hello World!');
    });
  });
});
