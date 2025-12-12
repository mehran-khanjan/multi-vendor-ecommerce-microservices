// src/grpc/clients/auth-grpc.client.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import { of } from 'rxjs';
import {
  IAuthGrpcService,
  ValidateTokenResponse,
  UserResponse,
} from '../interfaces';
import { UserContext } from '@common/interfaces';

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
        protoPath: join(__dirname, '../proto/auth.proto'),
        url,
      },
    }) as unknown as ClientGrpc;

    this.authService = this.client.getService<IAuthGrpcService>('AuthService');
    this.logger.log(`Auth gRPC client initialized for ${url}`);
  }

  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; user?: UserContext; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.authService.validateToken({ token }).pipe(
          timeout(5000),
          retry(2),
          catchError((error) => {
            this.logger.error(`Token validation failed: ${error.message}`);
            return of({
              valid: false,
              error: error.message,
            } as ValidateTokenResponse);
          }),
        ),
      );

      if (!response.valid || !response.user) {
        return { valid: false, error: response.error || 'Invalid token' };
      }

      return {
        valid: true,
        user: {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          vendorId: response.user.vendorId,
          permissions:
            response.user.permissions?.map((p) => ({
              action: p.action,
              subject: p.subject,
              conditions: p.conditions ? JSON.parse(p.conditions) : undefined,
            })) || [],
          firstName: response.user.firstName,
          lastName: response.user.lastName,
        },
      };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      return await firstValueFrom(
        this.authService.getUserById({ userId }).pipe(
          timeout(5000),
          retry(2),
          catchError((error) => {
            this.logger.error(`Get user failed: ${error.message}`);
            return of({ success: false, error: error.message } as UserResponse);
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Get user error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
