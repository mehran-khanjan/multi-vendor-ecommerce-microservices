// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSIONS_KEY, RequiredPermission } from '@common/decorators';
import { CaslAbilityFactory } from '@modules/casl/casl-ability.factory';
import { AuthException } from '@common/exceptions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
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
    const user = req.user;

    if (!user) {
      throw AuthException.unauthorized();
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    const hasAllPermissions = requiredPermissions.every((permission) =>
      ability.can(permission.action, permission.subject),
    );

    if (!hasAllPermissions) {
      throw AuthException.insufficientPermissions();
    }

    return true;
  }
}
