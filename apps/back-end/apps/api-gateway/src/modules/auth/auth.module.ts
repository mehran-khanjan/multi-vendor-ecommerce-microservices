// src/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import configuration from '../../config/configuration';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ load: [configuration] }), HttpModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
