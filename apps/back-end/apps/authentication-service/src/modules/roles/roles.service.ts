// src/modules/roles/roles.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, RoleType } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleInput, UpdateRoleInput, CreatePermissionInput } from './dto';
import { AuthException } from '@common/exceptions';
import { ERROR_CODES } from '@common/constants';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // ==================== Roles ====================

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new AuthException({
        code: ERROR_CODES.ROLE_NOT_FOUND,
        message: 'Role not found',
      });
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    return this.roleRepository.find({
      where: { id: In(ids) },
      relations: ['permissions'],
    });
  }

  async findDefaultRole(): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { isDefault: true },
      relations: ['permissions'],
    });
  }

  async createRole(input: CreateRoleInput): Promise<Role> {
    // Check if name exists
    const existing = await this.findByName(input.name);
    if (existing) {
      throw new AuthException({
        code: ERROR_CODES.ROLE_ALREADY_EXISTS,
        message: 'A role with this name already exists',
      });
    }

    // Get permissions
    let permissions: Permission[] = [];
    if (input.permissionIds?.length > 0) {
      permissions = await this.permissionRepository.find({
        where: { id: In(input.permissionIds) },
      });
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.roleRepository.update({}, { isDefault: false });
    }

    const role = this.roleRepository.create({
      name: input.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: input.displayName,
      description: input.description,
      type: RoleType.CUSTOM,
      isDefault: input.isDefault || false,
      permissions,
    });

    const savedRole = await this.roleRepository.save(role);
    this.logger.log(`Role created: ${savedRole.id} (${savedRole.name})`);

    return this.findRoleById(savedRole.id);
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const role = await this.findRoleById(id);

    // Cannot modify system roles
    if (role.type === RoleType.SYSTEM && input.name) {
      throw new AuthException({
        code: 'CANNOT_MODIFY_SYSTEM_ROLE',
        message: 'Cannot modify system role name',
      });
    }

    // Check name uniqueness
    if (input.name && input.name !== role.name) {
      const existing = await this.findByName(input.name);
      if (existing) {
        throw new AuthException({
          code: ERROR_CODES.ROLE_ALREADY_EXISTS,
          message: 'A role with this name already exists',
        });
      }
    }

    // Handle permissions
    if (input.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(input.permissionIds) },
      });
      role.permissions = permissions;
    }

    // Handle default flag
    if (input.isDefault && !role.isDefault) {
      await this.roleRepository.update({}, { isDefault: false });
    }

    // Update other fields
    if (input.name) role.name = input.name.toLowerCase().replace(/\s+/g, '_');
    if (input.displayName) role.displayName = input.displayName;
    if (input.description !== undefined) role.description = input.description;
    if (input.isDefault !== undefined) role.isDefault = input.isDefault;

    await this.roleRepository.save(role);
    this.logger.log(`Role updated: ${id}`);

    return this.findRoleById(id);
  }

  async deleteRole(id: string): Promise<boolean> {
    const role = await this.findRoleById(id);

    if (role.type === RoleType.SYSTEM) {
      throw new AuthException({
        code: ERROR_CODES.CANNOT_DELETE_SYSTEM_ROLE,
        message: 'Cannot delete system role',
      });
    }

    await this.roleRepository.softDelete(id);
    this.logger.log(`Role deleted: ${id}`);

    return true;
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    role.permissions = [...role.permissions, ...permissions];
    await this.roleRepository.save(role);

    this.logger.log(`Permissions assigned to role ${roleId}`);

    return this.findRoleById(roleId);
  }

  async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    role.permissions = role.permissions.filter(
      (p) => !permissionIds.includes(p.id),
    );
    await this.roleRepository.save(role);

    this.logger.log(`Permissions removed from role ${roleId}`);

    return this.findRoleById(roleId);
  }

  // ==================== Permissions ====================

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new AuthException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    return permission;
  }

  async findPermissionBySlug(slug: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { slug } });
  }

  async findPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepository.find({ where: { resource } });
  }

  async createPermission(input: CreatePermissionInput): Promise<Permission> {
    const slug = `${input.resource}:${input.action}:${input.scope || 'any'}`;

    const existing = await this.findPermissionBySlug(slug);
    if (existing) {
      throw new AuthException({
        code: 'PERMISSION_ALREADY_EXISTS',
        message: 'A permission with this combination already exists',
      });
    }

    const permission = this.permissionRepository.create({
      resource: input.resource,
      action: input.action,
      scope: input.scope || 'any',
      slug,
      description: input.description,
    });

    const saved = await this.permissionRepository.save(permission);
    this.logger.log(`Permission created: ${saved.id} (${saved.slug})`);

    return saved;
  }

  async deletePermission(id: string): Promise<boolean> {
    await this.findPermissionById(id);
    await this.permissionRepository.softDelete(id);
    this.logger.log(`Permission deleted: ${id}`);
    return true;
  }
}
