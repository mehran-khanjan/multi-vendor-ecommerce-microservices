// src/common/middleware/auth-context.middleware.ts
import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthGrpcClient } from '@grpc/clients';

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(private readonly authGrpcClient: AuthGrpcClient) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!req.context) {
      (req as any).context = {};
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const result = await this.authGrpcClient.validateToken(token);

        if (result.valid && result.user) {
          (req as any).context.user = {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            vendorId: result.user.vendorId,
            permissions: result.user.permissions || [],
          };
        }
      } catch (error) {
        // Token validation failed, continue without user context
        console.error('Token validation error:', error.message);
      }
    }

    next();
  }
}
