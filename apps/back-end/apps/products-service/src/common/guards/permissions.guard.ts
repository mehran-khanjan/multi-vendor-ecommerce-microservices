// src/common/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_KEY, RequiredPermission } from '@common/decorators';
import { AuthorizationService } from '@modules/authorization/authorization.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.context?.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Get the resource being accessed (if any) for ownership checks
    const args = ctx.getArgs();
    const resourceData = this.extractResourceData(args);

    for (const permission of requiredPermissions) {
      const canAccess = this.authService.checkPermission(
        user,
        permission.action,
        permission.subject,
        { ...permission.conditions, ...resourceData },
      );

      if (!canAccess) {
        throw new ForbiddenException(
          `Insufficient permissions: requires ${permission.action} on ${permission.subject}`,
        );
      }
    }

    return true;
  }

  private extractResourceData(args: any): Record<string, any> {
    const data: Record<string, any> = {};

    // Extract vendorId from various input patterns
    if (args.vendorId) {
      data.vendorId = args.vendorId;
    }
    if (args.input?.vendorId) {
      data.vendorId = args.input.vendorId;
    }

    return data;
  }
}
