// src/modules/authorization/field-permissions.ts
import { Action, Subject, Role } from '@common/enums';

/**
 * Field-level permission definitions
 * Maps fields to required permissions for access
 */
export const FIELD_PERMISSIONS: Record<
  string,
  {
    action: Action;
    subject: Subject;
    allowedRoles?: Role[];
  }
> = {
  // Product fields
  'Product.sku': {
    action: Action.READ_SKU,
    subject: Subject.PRODUCT,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
  },
  'Product.costPrice': {
    action: Action.READ_COST,
    subject: Subject.PRODUCT,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
  },

  // Inventory fields
  'Inventory.stockQuantity': {
    action: Action.READ_STOCK,
    subject: Subject.INVENTORY,
    allowedRoles: [
      Role.ADMIN,
      Role.SUPER_ADMIN,
      Role.VENDOR_OWNER,
      Role.VENDOR,
    ],
  },
  'Inventory.lowStockThreshold': {
    action: Action.READ_STOCK,
    subject: Subject.INVENTORY,
    allowedRoles: [
      Role.ADMIN,
      Role.SUPER_ADMIN,
      Role.VENDOR_OWNER,
      Role.VENDOR,
    ],
  },

  // Vendor Product fields
  'VendorProduct.purchasePrice': {
    action: Action.READ_COST,
    subject: Subject.VENDOR_PRODUCT,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN, Role.VENDOR_OWNER],
  },
};

/**
 * Check if a role can access a specific field
 */
export function canAccessField(fieldPath: string, roles: Role[]): boolean {
  const permission = FIELD_PERMISSIONS[fieldPath];

  if (!permission) {
    return true; // No restriction defined
  }

  if (!permission.allowedRoles) {
    return true;
  }

  return roles.some((role) => permission.allowedRoles!.includes(role));
}
