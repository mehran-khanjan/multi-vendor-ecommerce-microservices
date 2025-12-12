// src/common/decorators/field-access.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Action, Subject } from '@common/enums';

export interface FieldPermission {
  action: Action;
  subject: Subject;
}

export const FIELD_PERMISSION_KEY = 'field_permission';

/**
 * Decorator to mark fields that require specific permissions
 * Fields without permission will be filtered based on user role
 */
export const FieldAccess = (permission: FieldPermission) =>
  SetMetadata(FIELD_PERMISSION_KEY, permission);
