// src/database/seeds/role.seed.ts
import { DataSource, In } from 'typeorm';
import { Role, RoleType } from '@modules/roles/entities/role.entity';
import { Permission } from '@modules/roles/entities/permission.entity';

const roles = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access',
    type: RoleType.SYSTEM,
    permissions: ['*'], // All permissions
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access',
    type: RoleType.SYSTEM,
    permissions: [
      'user:manage:any',
      'role:manage:any',
      'permission:read:any',
      'product:manage:any',
      'order:manage:any',
      'vendor:manage:any',
      'analytics:read:any',
      'settings:read:any',
      'settings:update:any',
    ],
  },
  {
    name: 'vendor_owner',
    displayName: 'Vendor Owner',
    description: 'Vendor owner with full vendor access',
    type: RoleType.SYSTEM,
    permissions: [
      'user:read:own',
      'user:update:own',
      'product:create:vendor',
      'product:read:vendor',
      'product:update:vendor',
      'product:delete:vendor',
      'order:read:vendor',
      'order:update:vendor',
      'vendor:read:own',
      'vendor:update:own',
      'analytics:read:vendor',
    ],
  },
  {
    name: 'vendor',
    displayName: 'Vendor Staff',
    description: 'Vendor staff with limited access',
    type: RoleType.SYSTEM,
    permissions: [
      'user:read:own',
      'user:update:own',
      'product:read:vendor',
      'product:update:vendor',
      'order:read:vendor',
      'analytics:read:vendor',
    ],
  },
  {
    name: 'customer',
    displayName: 'Customer',
    description: 'Regular customer',
    type: RoleType.SYSTEM,
    isDefault: true,
    permissions: [
      'user:read:own',
      'user:update:own',
      'product:read:any',
      'order:create:own',
      'order:read:own',
      'vendor:read:any',
    ],
  },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  for (const roleData of roles) {
    let role = await roleRepository.findOne({
      where: { name: roleData.name },
      relations: ['permissions'],
    });

    if (!role) {
      // Get permissions
      let permissions: Permission[] = [];
      if (roleData.permissions[0] === '*') {
        permissions = await permissionRepository.find();
      } else {
        permissions = await permissionRepository.find({
          where: { slug: In(roleData.permissions) },
        });
      }

      role = roleRepository.create({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        type: roleData.type,
        isDefault: roleData.isDefault || false,
        permissions,
      });

      await roleRepository.save(role);
      console.log(`Created role: ${roleData.name}`);
    }
  }
}
