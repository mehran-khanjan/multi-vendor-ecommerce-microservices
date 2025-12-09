// src/database/seeds/permission.seed.ts
import { DataSource } from 'typeorm';
import { Permission } from '@modules/roles/entities/permission.entity';

const permissions = [
  // User permissions
  {
    resource: 'user',
    action: 'create',
    scope: 'any',
    description: 'Create any user',
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'any',
    description: 'Read any user',
  },
  {
    resource: 'user',
    action: 'read',
    scope: 'own',
    description: 'Read own user profile',
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'any',
    description: 'Update any user',
  },
  {
    resource: 'user',
    action: 'update',
    scope: 'own',
    description: 'Update own profile',
  },
  {
    resource: 'user',
    action: 'delete',
    scope: 'any',
    description: 'Delete any user',
  },
  {
    resource: 'user',
    action: 'manage',
    scope: 'any',
    description: 'Full user management',
  },

  // Role permissions
  {
    resource: 'role',
    action: 'create',
    scope: 'any',
    description: 'Create roles',
  },
  { resource: 'role', action: 'read', scope: 'any', description: 'Read roles' },
  {
    resource: 'role',
    action: 'update',
    scope: 'any',
    description: 'Update roles',
  },
  {
    resource: 'role',
    action: 'delete',
    scope: 'any',
    description: 'Delete roles',
  },
  {
    resource: 'role',
    action: 'manage',
    scope: 'any',
    description: 'Full role management',
  },

  // Permission permissions
  {
    resource: 'permission',
    action: 'read',
    scope: 'any',
    description: 'Read permissions',
  },
  {
    resource: 'permission',
    action: 'manage',
    scope: 'any',
    description: 'Full permission management',
  },

  // Product permissions
  {
    resource: 'product',
    action: 'create',
    scope: 'vendor',
    description: 'Create products for vendor',
  },
  {
    resource: 'product',
    action: 'read',
    scope: 'any',
    description: 'Read all products',
  },
  {
    resource: 'product',
    action: 'read',
    scope: 'vendor',
    description: 'Read vendor products',
  },
  {
    resource: 'product',
    action: 'update',
    scope: 'vendor',
    description: 'Update vendor products',
  },
  {
    resource: 'product',
    action: 'delete',
    scope: 'vendor',
    description: 'Delete vendor products',
  },
  {
    resource: 'product',
    action: 'manage',
    scope: 'any',
    description: 'Full product management',
  },

  // Order permissions
  {
    resource: 'order',
    action: 'create',
    scope: 'own',
    description: 'Create orders',
  },
  {
    resource: 'order',
    action: 'read',
    scope: 'own',
    description: 'Read own orders',
  },
  {
    resource: 'order',
    action: 'read',
    scope: 'vendor',
    description: 'Read vendor orders',
  },
  {
    resource: 'order',
    action: 'read',
    scope: 'any',
    description: 'Read all orders',
  },
  {
    resource: 'order',
    action: 'update',
    scope: 'vendor',
    description: 'Update vendor orders',
  },
  {
    resource: 'order',
    action: 'manage',
    scope: 'any',
    description: 'Full order management',
  },

  // Vendor permissions
  {
    resource: 'vendor',
    action: 'create',
    scope: 'any',
    description: 'Create vendors',
  },
  {
    resource: 'vendor',
    action: 'read',
    scope: 'any',
    description: 'Read all vendors',
  },
  {
    resource: 'vendor',
    action: 'read',
    scope: 'own',
    description: 'Read own vendor',
  },
  {
    resource: 'vendor',
    action: 'update',
    scope: 'own',
    description: 'Update own vendor',
  },
  {
    resource: 'vendor',
    action: 'update',
    scope: 'any',
    description: 'Update any vendor',
  },
  {
    resource: 'vendor',
    action: 'manage',
    scope: 'any',
    description: 'Full vendor management',
  },

  // Analytics permissions
  {
    resource: 'analytics',
    action: 'read',
    scope: 'vendor',
    description: 'Read vendor analytics',
  },
  {
    resource: 'analytics',
    action: 'read',
    scope: 'any',
    description: 'Read platform analytics',
  },

  // Settings permissions
  {
    resource: 'settings',
    action: 'read',
    scope: 'any',
    description: 'Read settings',
  },
  {
    resource: 'settings',
    action: 'update',
    scope: 'any',
    description: 'Update settings',
  },
];

export async function seedPermissions(
  dataSource: DataSource,
): Promise<Permission[]> {
  const permissionRepository = dataSource.getRepository(Permission);
  const savedPermissions: Permission[] = [];

  for (const permData of permissions) {
    const slug = `${permData.resource}:${permData.action}:${permData.scope}`;

    let permission = await permissionRepository.findOne({ where: { slug } });

    if (!permission) {
      permission = permissionRepository.create({ ...permData, slug });
      permission = await permissionRepository.save(permission);
      console.log(`Created permission: ${slug}`);
    }

    savedPermissions.push(permission);
  }

  return savedPermissions;
}
