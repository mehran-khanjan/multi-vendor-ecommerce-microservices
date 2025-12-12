// src/common/decorators/require-permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Action, Subject } from '../enums';

export interface Permission {
  action: Action;
  subject: Subject;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
