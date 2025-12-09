// src/modules/users/users.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { RolesService } from '@modules/roles/roles.service';
import { User, UserStatus } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserAddress } from './entities/user-address.entity';
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  UserFilterInput,
} from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';
import { AuthException } from '@common/exceptions';
import { CryptoUtil } from '@common/utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rolesService: RolesService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw AuthException.userNotFound();
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw AuthException.userNotFound();
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async findAll(
    filter: UserFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ users: User[]; meta: PaginationMeta }> {
    return this.usersRepository.findAll(filter, pagination);
  }

  async create(input: CreateUserInput): Promise<User> {
    // Check if email exists
    const emailExists = await this.usersRepository.emailExists(input.email);
    if (emailExists) {
      throw AuthException.emailAlreadyExists();
    }

    // Check if phone exists
    if (input.phoneNumber) {
      const phoneExists = await this.usersRepository.phoneExists(
        input.phoneNumber,
      );
      if (phoneExists) {
        throw new AuthException({
          code: 'PHONE_ALREADY_EXISTS',
          message: 'An account with this phone number already exists',
        });
      }
    }

    // Hash password
    const passwordHash = await CryptoUtil.hashPassword(input.password);

    // Get roles
    let roles = [];
    if (input.roleIds?.length > 0) {
      roles = await this.rolesService.findByIds(input.roleIds);
    } else {
      // Assign default customer role
      const defaultRole = await this.rolesService.findByName('customer');
      if (defaultRole) {
        roles = [defaultRole];
      }
    }

    // Create user
    const user = await this.usersRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      status: UserStatus.PENDING,
      roles,
    });

    // Create empty profile
    await this.usersRepository.createProfile({ userId: user.id });

    this.logger.log(`User created: ${user.id} (${user.email})`);

    return this.findById(user.id);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findById(id);

    // Check phone uniqueness if changed
    if (input.phoneNumber && input.phoneNumber !== user.phoneNumber) {
      const phoneExists = await this.usersRepository.phoneExists(
        input.phoneNumber,
        id,
      );
      if (phoneExists) {
        throw new AuthException({
          code: 'PHONE_ALREADY_EXISTS',
          message: 'An account with this phone number already exists',
        });
      }
    }

    // Handle role updates
    if (input.roleIds) {
      const roles = await this.rolesService.findByIds(input.roleIds);
      await this.usersRepository.update(id, { ...input, roles } as any);
    } else {
      await this.usersRepository.update(id, input as any);
    }

    this.logger.log(`User updated: ${id}`);

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id); // Ensure exists
    await this.usersRepository.delete(id);
    this.logger.log(`User deleted: ${id}`);
    return true;
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    await this.findById(userId); // Ensure user exists
    return this.usersRepository.updateProfile(userId, input as any);
  }

  async getAddresses(userId: string): Promise<UserAddress[]> {
    return this.usersRepository.findAddressesByUserId(userId);
  }

  async addAddress(
    userId: string,
    addressData: Partial<UserAddress>,
  ): Promise<UserAddress> {
    await this.findById(userId); // Ensure user exists
    return this.usersRepository.createAddress({ ...addressData, userId });
  }

  async updateAddress(
    id: string,
    userId: string,
    addressData: Partial<UserAddress>,
  ): Promise<UserAddress> {
    const address = await this.usersRepository.findAddressById(id, userId);
    if (!address) {
      throw new AuthException({
        code: 'NOT_FOUND',
        message: 'Address not found',
      });
    }
    return this.usersRepository.updateAddress(id, userId, addressData);
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const address = await this.usersRepository.findAddressById(id, userId);
    if (!address) {
      throw new AuthException({
        code: 'NOT_FOUND',
        message: 'Address not found',
      });
    }
    await this.usersRepository.deleteAddress(id, userId);
    return true;
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findById(userId);
    const roles = await this.rolesService.findByIds(roleIds);

    await this.usersRepository.update(userId, { roles } as any);

    this.logger.log(`Roles assigned to user ${userId}: ${roleIds.join(', ')}`);

    return this.findById(userId);
  }

  async removeRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findById(userId);
    const remainingRoles = user.roles.filter(
      (role) => !roleIds.includes(role.id),
    );

    await this.usersRepository.update(userId, { roles: remainingRoles } as any);

    this.logger.log(`Roles removed from user ${userId}: ${roleIds.join(', ')}`);

    return this.findById(userId);
  }

  async suspendUser(id: string, reason?: string): Promise<User> {
    const user = await this.findById(id);

    await this.usersRepository.update(id, { status: UserStatus.SUSPENDED });

    this.logger.warn(
      `User suspended: ${id}. Reason: ${reason || 'Not specified'}`,
    );

    return this.findById(id);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findById(id);

    await this.usersRepository.update(id, { status: UserStatus.ACTIVE });

    this.logger.log(`User activated: ${id}`);

    return this.findById(id);
  }

  async banUser(id: string, reason?: string): Promise<User> {
    const user = await this.findById(id);

    await this.usersRepository.update(id, { status: UserStatus.BANNED });

    this.logger.warn(
      `User banned: ${id}. Reason: ${reason || 'Not specified'}`,
    );

    return this.findById(id);
  }

  // For federation - resolve user reference
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<User> {
    return this.findById(reference.id);
  }
}
