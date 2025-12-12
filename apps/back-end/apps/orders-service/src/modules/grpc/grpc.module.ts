// src/grpc/grpc.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGrpcClient, ProductGrpcClient } from './clients';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AuthGrpcClient, ProductGrpcClient],
  exports: [AuthGrpcClient, ProductGrpcClient],
})
export class GrpcModule {}
