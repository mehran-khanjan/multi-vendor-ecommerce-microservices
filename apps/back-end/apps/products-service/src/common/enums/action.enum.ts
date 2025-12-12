// src/common/enums/action.enum.ts
export enum Action {
  MANAGE = 'manage', // Full access
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // Custom actions for products
  READ_STOCK = 'read_stock',
  UPDATE_STOCK = 'update_stock',
  READ_SKU = 'read_sku',
  READ_COST = 'read_cost',
  SET_PRICE = 'set_price',
  PUBLISH = 'publish',
}

/*
 *
 * Better Approach
 *
 * // src/common/enums/actions.enum.ts
export enum Action {
  // CRUD Actions
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',

  // Special Actions
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  APPROVE = 'approve',
  REJECT = 'reject',

  // Field-level Actions
  READ_SKU = 'read_sku',
  READ_COST = 'read_cost',
  READ_STOCK = 'read_stock',
  UPDATE_STOCK = 'update_stock',
  READ_PURCHASE_PRICE = 'read_purchase_price',

  // Management Actions
  MANAGE = 'manage', // Full access
  MANAGE_USERS = 'manage_users',
  MANAGE_VENDORS = 'manage_vendors',
  MANAGE_ORDERS = 'manage_orders',
}
 * * */
