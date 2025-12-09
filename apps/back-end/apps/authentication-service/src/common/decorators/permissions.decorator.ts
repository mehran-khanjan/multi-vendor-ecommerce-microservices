// src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Action, Subject } from '@common/enums';

export interface RequiredPermission {
  action: Action;
  subject: Subject;
}

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Convenience decorators
export const CanCreate = (subject: Subject) =>
  RequirePermissions({ action: Action.CREATE, subject });

export const CanRead = (subject: Subject) =>
  RequirePermissions({ action: Action.READ, subject });

export const CanUpdate = (subject: Subject) =>
  RequirePermissions({ action: Action.UPDATE, subject });

export const CanDelete = (subject: Subject) =>
  RequirePermissions({ action: Action.DELETE, subject });

export const CanManage = (subject: Subject) =>
  RequirePermissions({ action: Action.MANAGE, subject });
