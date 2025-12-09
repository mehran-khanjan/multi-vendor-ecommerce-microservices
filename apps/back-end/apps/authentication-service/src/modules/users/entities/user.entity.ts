// src/modules/users/entities/user.entity.ts
import {
  Entity,
  Column,
  Index,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Field, ObjectType, HideField, Directive } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { UserProfile } from './user-profile.entity';
import { UserAddress } from './user-address.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { Session } from '@modules/sessions/entities/session.entity';
import { CryptoUtil } from '@common/utils';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('users')
export class User extends BaseEntity {
  @Field()
  @Column({ unique: true })
  @Index()
  email: string;

  @Field()
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @HideField()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Field({ nullable: true })
  @Column({ name: 'phone_number', nullable: true })
  @Index()
  phoneNumber?: string;

  @Field()
  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Field()
  @Column({ name: 'first_name' })
  firstName: string;

  @Field()
  @Column({ name: 'last_name' })
  lastName: string;

  @Field()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Field({ nullable: true })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Field()
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @Index()
  status: UserStatus;

  @Field({ nullable: true })
  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', nullable: true })
  lockedUntil?: Date;

  // Two-Factor Authentication
  @Field()
  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @HideField()
  @Column({ name: 'two_factor_secret', nullable: true })
  twoFactorSecret?: string;

  @HideField()
  @Column({
    name: 'two_factor_backup_codes',
    type: 'text',
    array: true,
    nullable: true,
  })
  twoFactorBackupCodes?: string[];

  @Column({ name: 'two_factor_verified_at', nullable: true })
  twoFactorVerifiedAt?: Date;

  // Tenant/Vendor association
  @Field({ nullable: true })
  @Column({ name: 'tenant_id', nullable: true })
  @Index()
  tenantId?: string;

  @Field({ nullable: true })
  @Column({ name: 'vendor_id', nullable: true })
  @Index()
  vendorId?: string;

  // Relations
  @Field(() => UserProfile, { nullable: true })
  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  profile?: UserProfile;

  @Field(() => [UserAddress], { nullable: true })
  @OneToMany(() => UserAddress, (address) => address.user, { cascade: true })
  addresses?: UserAddress[];

  @Field(() => [Role])
  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => Session, (session) => session.user)
  sessions?: Session[];

  // Helper methods
  @Field(() => [String])
  get roleNames(): string[] {
    return this.roles?.map((role) => role.name) || [];
  }

  @Field(() => [String])
  get permissions(): string[] {
    const permissionSet = new Set<string>();
    this.roles?.forEach((role) => {
      role.permissions?.forEach((permission) => {
        permissionSet.add(permission.slug);
      });
    });
    return Array.from(permissionSet);
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false;
  }

  hasPermission(permissionSlug: string): boolean {
    return this.permissions.includes(permissionSlug);
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await CryptoUtil.hashPassword(password);
  }

  async validatePassword(password: string): Promise<boolean> {
    return CryptoUtil.comparePassword(password, this.passwordHash);
  }
}
