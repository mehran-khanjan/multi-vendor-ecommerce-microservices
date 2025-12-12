// src/common/decorators/permissions.decorator.ts
import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { Action, Subject } from '@common/enums';
import { PermissionsGuard } from '@common/guards';

export interface RequiredPermission {
  action: Action;
  subject: Subject;
  conditions?: Record<string, any>;
}

export const PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Convenience decorators for common operations
export const CanCreate = (subject: Subject) =>
  applyDecorators(
    RequirePermissions({ action: Action.CREATE, subject }),
    UseGuards(PermissionsGuard),
  );

export const CanRead = (subject: Subject) =>
  applyDecorators(
    RequirePermissions({ action: Action.READ, subject }),
    UseGuards(PermissionsGuard),
  );

export const CanUpdate = (subject: Subject) =>
  applyDecorators(
    RequirePermissions({ action: Action.UPDATE, subject }),
    UseGuards(PermissionsGuard),
  );

export const CanDelete = (subject: Subject) =>
  applyDecorators(
    RequirePermissions({ action: Action.DELETE, subject }),
    UseGuards(PermissionsGuard),
  );

export const CanManage = (subject: Subject) =>
  applyDecorators(
    RequirePermissions({ action: Action.MANAGE, subject }),
    UseGuards(PermissionsGuard),
  );

// Product-specific decorators
export const CanReadStock = () =>
  applyDecorators(
    RequirePermissions({
      action: Action.READ_STOCK,
      subject: Subject.INVENTORY,
    }),
    UseGuards(PermissionsGuard),
  );

export const CanUpdateStock = () =>
  applyDecorators(
    RequirePermissions({
      action: Action.UPDATE_STOCK,
      subject: Subject.INVENTORY,
    }),
    UseGuards(PermissionsGuard),
  );

export const CanReadSku = () =>
  applyDecorators(
    RequirePermissions({ action: Action.READ_SKU, subject: Subject.PRODUCT }),
    UseGuards(PermissionsGuard),
  );

export const CanSetPrice = () =>
  applyDecorators(
    RequirePermissions({
      action: Action.SET_PRICE,
      subject: Subject.VENDOR_PRODUCT,
    }),
    UseGuards(PermissionsGuard),
  );
