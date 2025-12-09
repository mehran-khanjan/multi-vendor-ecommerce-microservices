// src/modules/roles/roles.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleInput, UpdateRoleInput, CreatePermissionInput } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@common/guards';
import { CanRead, CanManage } from '@common/decorators';
import { Subject } from '@common/enums';

@Resolver(() => Role)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  // ==================== Role Queries ====================

  @Query(() => [Role], { name: 'roles' })
  @CanRead(Subject.ROLE)
  async getRoles(): Promise<Role[]> {
    return this.rolesService.findAllRoles();
  }

  @Query(() => Role, { name: 'role' })
  @CanRead(Subject.ROLE)
  async getRole(@Args('id', { type: () => ID }) id: string): Promise<Role> {
    return this.rolesService.findRoleById(id);
  }

  @Query(() => [Permission], { name: 'permissions' })
  @CanRead(Subject.PERMISSION)
  async getPermissions(): Promise<Permission[]> {
    return this.rolesService.findAllPermissions();
  }

  // ==================== Role Mutations ====================

  @Mutation(() => Role)
  @CanManage(Subject.ROLE)
  async createRole(@Args('input') input: CreateRoleInput): Promise<Role> {
    return this.rolesService.createRole(input);
  }

  @Mutation(() => Role)
  @CanManage(Subject.ROLE)
  async updateRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoleInput,
  ): Promise<Role> {
    return this.rolesService.updateRole(id, input);
  }

  @Mutation(() => Boolean)
  @CanManage(Subject.ROLE)
  async deleteRole(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.rolesService.deleteRole(id);
  }

  @Mutation(() => Role)
  @CanManage(Subject.ROLE)
  async assignPermissionsToRole(
    @Args('roleId', { type: () => ID }) roleId: string,
    @Args('permissionIds', { type: () => [ID] }) permissionIds: string[],
  ): Promise<Role> {
    return this.rolesService.assignPermissionsToRole(roleId, permissionIds);
  }

  // ==================== Permission Mutations ====================

  @Mutation(() => Permission)
  @CanManage(Subject.PERMISSION)
  async createPermission(
    @Args('input') input: CreatePermissionInput,
  ): Promise<Permission> {
    return this.rolesService.createPermission(input);
  }

  @Mutation(() => Boolean)
  @CanManage(Subject.PERMISSION)
  async deletePermission(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.rolesService.deletePermission(id);
  }
}
