// src/grpc/grpc.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGrpcClient } from './clients';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthGrpcClient],
  exports: [AuthGrpcClient],
})
export class GrpcModule {}
