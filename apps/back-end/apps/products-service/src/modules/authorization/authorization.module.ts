// src/modules/authorization/authorization.module.ts
import { Module, Global } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { CaslAbilityFactory } from './casl-ability.factory';

@Global()
@Module({
  providers: [AuthorizationService, CaslAbilityFactory],
  exports: [AuthorizationService, CaslAbilityFactory],
})
export class AuthorizationModule {}
