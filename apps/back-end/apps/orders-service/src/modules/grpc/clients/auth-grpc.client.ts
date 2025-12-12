// src/grpc/clients/auth-grpc.client.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import {
  IAuthGrpcService,
  ValidateTokenResponse,
  GetUserAddressResponse,
  GetUserAddressesResponse,
  UserResponse,
} from '../interfaces';

@Injectable()
export class AuthGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(AuthGrpcClient.name);
  private authService: IAuthGrpcService;
  private client: ClientGrpc;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('grpc.authService.url');

    this.client = Client({
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, '../../proto/auth.proto'),
        url,
      },
    }) as unknown as ClientGrpc;

    this.authService = this.client.getService<IAuthGrpcService>('AuthService');
    this.logger.log(`Auth gRPC client connected to ${url}`);
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      return await firstValueFrom(this.authService.validateToken({ token }));
    } catch (error) {
      this.logger.error(`Failed to validate token: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  async getUserAddress(
    userId: string,
    addressId: string,
  ): Promise<GetUserAddressResponse> {
    try {
      return await firstValueFrom(
        this.authService.getUserAddress({ userId, addressId }),
      );
    } catch (error) {
      this.logger.error(`Failed to get user address: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getUserAddresses(userId: string): Promise<GetUserAddressesResponse> {
    try {
      return await firstValueFrom(
        this.authService.getUserAddresses({ userId }),
      );
    } catch (error) {
      this.logger.error(`Failed to get user addresses: ${error.message}`);
      return { success: false, addresses: [], error: error.message };
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      return await firstValueFrom(this.authService.getUserById({ userId }));
    } catch (error) {
      this.logger.error(`Failed to get user: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
