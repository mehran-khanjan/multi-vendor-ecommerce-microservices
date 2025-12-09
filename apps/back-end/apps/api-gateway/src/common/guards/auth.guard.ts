// src/common/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@common/decorators';
import { GatewayException } from '@common/exceptions';
import { OperationParser } from '@common/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly publicOperations: string[];

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.publicOperations = this.configService.get<string[]>(
      'auth.publicOperations',
      [],
    );
  }

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public via decorator
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublicRoute) {
      return true;
    }

    // For GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const info = ctx.getInfo();

    // Check if operation is public
    const operationName =
      info?.operation?.name?.value || this.extractOperationName(req);

    if (operationName && this.isPublicOperation(operationName)) {
      return true;
    }

    // Check if user is authenticated
    const gatewayContext = req.context;

    if (!gatewayContext?.isAuthenticated) {
      this.logger.debug(
        `[${gatewayContext?.requestId}] Unauthenticated request to ${operationName}`,
      );
      throw GatewayException.unauthenticated();
    }

    // Check token expiration
    if (gatewayContext.user?.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (gatewayContext.user.exp < now) {
        throw new GatewayException(
          { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
          401,
        );
      }
    }

    return true;
  }

  private isPublicOperation(operationName: string): boolean {
    return this.publicOperations.includes(operationName);
  }

  private extractOperationName(req: any): string | null {
    try {
      const body = req.body;
      if (body?.operationName) {
        return body.operationName;
      }
      if (body?.query) {
        const info = OperationParser.parse(body.query, body.operationName);
        return info.name;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }
}
