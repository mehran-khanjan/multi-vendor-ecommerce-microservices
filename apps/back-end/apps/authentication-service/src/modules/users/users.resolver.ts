// src/modules/users/users.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveReference,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserAddress } from './entities/user-address.entity';
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  UserFilterInput,
} from './dto';
import {
  PaginationInput,
  PaginationMeta,
  createPaginatedResponse,
} from '@common/dto';
import { JwtAuthGuard, PermissionsGuard } from '@common/guards';
import {
  CurrentUser,
  RequirePermissions,
  CanRead,
  CanUpdate,
  CanDelete,
  CanManage,
} from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class PaginatedUsersResponse extends createPaginatedResponse(User) {}

@Resolver(() => User)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // ==================== Queries ====================

  @Query(() => User, { name: 'me' })
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Query(() => User, { name: 'user' })
  @CanRead(Subject.USER)
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Query(() => PaginatedUsersResponse, { name: 'users' })
  @CanRead(Subject.USER)
  async getUsers(
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: User[]; meta: PaginationMeta }> {
    const result = await this.usersService.findAll(filter, pagination);
    return { items: result.users, meta: result.meta };
  }

  @Query(() => [UserAddress], { name: 'myAddresses' })
  async getMyAddresses(@CurrentUser() user: User): Promise<UserAddress[]> {
    return this.usersService.getAddresses(user.id);
  }

  // ==================== Mutations ====================

  @Mutation(() => User)
  @CanManage(Subject.USER)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }

  @Mutation(() => User)
  async updateMyProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    // Users can only update their own non-sensitive data
    const { status, ...safeInput } = input;
    return this.usersService.update(user.id, safeInput);
  }

  @Mutation(() => User)
  @CanUpdate(Subject.USER)
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.update(id, input);
  }

  @Mutation(() => Boolean)
  @CanDelete(Subject.USER)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.usersService.delete(id);
  }

  @Mutation(() => UserProfile)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<UserProfile> {
    return this.usersService.updateProfile(user.id, input);
  }

  @Mutation(() => UserAddress)
  async addAddress(
    @CurrentUser() user: User,
    @Args('input') input: any, // CreateAddressInput
  ): Promise<UserAddress> {
    return this.usersService.addAddress(user.id, input);
  }

  @Mutation(() => UserAddress)
  async updateAddress(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: any, // UpdateAddressInput
  ): Promise<UserAddress> {
    return this.usersService.updateAddress(id, user.id, input);
  }

  @Mutation(() => Boolean)
  async deleteAddress(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.usersService.deleteAddress(id, user.id);
  }

  @Mutation(() => User)
  @CanManage(Subject.USER)
  async assignRolesToUser(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('roleIds', { type: () => [ID] }) roleIds: string[],
  ): Promise<User> {
    return this.usersService.assignRoles(userId, roleIds);
  }

  @Mutation(() => User)
  @CanManage(Subject.USER)
  async suspendUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<User> {
    return this.usersService.suspendUser(id, reason);
  }

  @Mutation(() => User)
  @CanManage(Subject.USER)
  async activateUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<User> {
    return this.usersService.activateUser(id);
  }

  // ==================== Federation ====================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<User> {
    return this.usersService.resolveReference(reference);
  }
}
