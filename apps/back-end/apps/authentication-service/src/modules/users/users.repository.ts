// src/modules/users/users.repository.ts (continued)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserFilterInput } from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'profile', 'addresses'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['roles', 'roles.permissions', 'profile'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userRepository.find({
      where: { id: In(ids) },
      relations: ['roles', 'roles.permissions', 'profile'],
    });
  }

  async findAll(
    filter: UserFilterInput,
    pagination: PaginationInput,
  ): Promise<{ users: User[]; meta: PaginationMeta }> {
    const query = this.buildFilterQuery(filter);

    const sortField = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'DESC';
    query.orderBy(`user.${sortField}`, sortOrder);

    const skip = (pagination.page - 1) * pagination.limit;
    query.skip(skip).take(pagination.limit);

    const [users, totalItems] = await query.getManyAndCount();

    const meta: PaginationMeta = {
      totalItems,
      itemCount: users.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { users, meta };
  }

  private buildFilterQuery(filter: UserFilterInput): SelectQueryBuilder<User> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.profile', 'profile');

    if (filter.search) {
      query.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search)',
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    if (filter.status) {
      query.andWhere('user.status = :status', { status: filter.status });
    }

    if (filter.emailVerified !== undefined) {
      query.andWhere('user.emailVerified = :emailVerified', {
        emailVerified: filter.emailVerified,
      });
    }

    if (filter.twoFactorEnabled !== undefined) {
      query.andWhere('user.twoFactorEnabled = :twoFactorEnabled', {
        twoFactorEnabled: filter.twoFactorEnabled,
      });
    }

    if (filter.roleId) {
      query.andWhere('roles.id = :roleId', { roleId: filter.roleId });
    }

    if (filter.tenantId) {
      query.andWhere('user.tenantId = :tenantId', {
        tenantId: filter.tenantId,
      });
    }

    if (filter.vendorId) {
      query.andWhere('user.vendorId = :vendorId', {
        vendorId: filter.vendorId,
      });
    }

    return query;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...userData,
      email: userData.email?.toLowerCase(),
    });
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, { passwordHash });
  }

  async updateLoginInfo(
    id: string,
    data: {
      lastLoginAt?: Date;
      lastLoginIp?: string;
      failedLoginAttempts?: number;
      lockedUntil?: Date | null;
    },
  ): Promise<void> {
    await this.userRepository.update(id, data);
  }

  async incrementFailedAttempts(id: string): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ failedLoginAttempts: () => 'failed_login_attempts + 1' })
      .where('id = :id', { id })
      .returning('failed_login_attempts')
      .execute();

    return result.raw[0]?.failed_login_attempts || 0;
  }

  async resetFailedAttempts(id: string): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.userRepository.update(id, { lockedUntil: until });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async updateTwoFactor(
    id: string,
    data: {
      twoFactorEnabled?: boolean;
      twoFactorSecret?: string | null;
      twoFactorBackupCodes?: string[] | null;
      twoFactorVerifiedAt?: Date | null;
    },
  ): Promise<void> {
    await this.userRepository.update(id, data);
  }

  // Profile operations
  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.profileRepository.findOne({ where: { userId } });
  }

  async createProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const profile = this.profileRepository.create(profileData);
    return this.profileRepository.save(profile);
  }

  async updateProfile(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<UserProfile> {
    let profile = await this.findProfileByUserId(userId);

    if (!profile) {
      profile = await this.createProfile({ userId, ...profileData });
    } else {
      await this.profileRepository.update({ userId }, profileData);
      profile = await this.findProfileByUserId(userId);
    }

    return profile;
  }

  // Address operations
  async findAddressesByUserId(userId: string): Promise<UserAddress[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC' },
    });
  }

  async findAddressById(
    id: string,
    userId: string,
  ): Promise<UserAddress | null> {
    return this.addressRepository.findOne({ where: { id, userId } });
  }

  async createAddress(addressData: Partial<UserAddress>): Promise<UserAddress> {
    // If this is default, unset other defaults
    if (addressData.isDefault) {
      await this.addressRepository.update(
        { userId: addressData.userId },
        { isDefault: false },
      );
    }

    const address = this.addressRepository.create(addressData);
    return this.addressRepository.save(address);
  }

  async updateAddress(
    id: string,
    userId: string,
    addressData: Partial<UserAddress>,
  ): Promise<UserAddress> {
    if (addressData.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    await this.addressRepository.update({ id, userId }, addressData);
    return this.findAddressById(id, userId);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    await this.addressRepository.delete({ id, userId });
  }

  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.toLowerCase() });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async phoneExists(
    phoneNumber: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.phoneNumber = :phoneNumber', { phoneNumber });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}
