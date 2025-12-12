// src/modules/authorization/authorization.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CaslAbilityFactory, AppAbility } from './casl-ability.factory';
import { Action, Subject, Role } from '@common/enums';
import { UserContext } from '@common/interfaces';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(private readonly caslAbilityFactory: CaslAbilityFactory) {}

  /**
   * Create ability for user
   */
  getAbility(user: UserContext | null): AppAbility {
    return this.caslAbilityFactory.createForUser(user);
  }

  /**
   * Check if user can perform action on subject
   */
  checkPermission(
    user: UserContext | null,
    action: Action,
    subject: Subject,
    resourceData?: Record<string, any>,
  ): boolean {
    const ability = this.getAbility(user);

    if (resourceData) {
      return ability.can(action, { ...resourceData, __typename: subject });
    }

    return ability.can(action, subject);
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: UserContext | null, role: Role): boolean {
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: UserContext | null): boolean {
    return (
      this.hasRole(user, Role.ADMIN) || this.hasRole(user, Role.SUPER_ADMIN)
    );
  }

  /**
   * Check if user is vendor (owner or staff)
   */
  isVendor(user: UserContext | null): boolean {
    return (
      this.hasRole(user, Role.VENDOR) || this.hasRole(user, Role.VENDOR_OWNER)
    );
  }

  /**
   * Check if user owns the vendor resource
   */
  isVendorOwner(user: UserContext | null, vendorId: string): boolean {
    if (!user) return false;
    return this.isVendor(user) && user.vendorId === vendorId;
  }

  /**
   * Check if user can access vendor data
   */
  canAccessVendorData(user: UserContext | null, vendorId: string): boolean {
    if (!user) return false;
    if (this.isAdmin(user)) return true;
    return this.isVendorOwner(user, vendorId);
  }

  /**
   * Get fields that should be hidden based on user permissions
   */
  getRestrictedFields(user: UserContext | null): string[] {
    const restricted: string[] = [];

    if (!user) {
      // Guest - hide all sensitive fields
      restricted.push('sku', 'costPrice', 'stockQuantity', 'lowStockThreshold');
      return restricted;
    }

    const ability = this.getAbility(user);

    // Check specific field permissions
    if (!ability.can(Action.READ_SKU, Subject.PRODUCT)) {
      restricted.push('sku');
    }

    if (!ability.can(Action.READ_COST, Subject.PRODUCT)) {
      restricted.push('costPrice');
    }

    if (!ability.can(Action.READ_STOCK, Subject.INVENTORY)) {
      restricted.push('stockQuantity', 'lowStockThreshold');
    }

    return restricted;
  }

  /**
   * Filter object to remove restricted fields
   */
  filterRestrictedFields<T extends Record<string, any>>(
    data: T,
    user: UserContext | null,
  ): Partial<T> {
    const restrictedFields = this.getRestrictedFields(user);
    const filtered = { ...data };

    for (const field of restrictedFields) {
      delete filtered[field];
    }

    return filtered;
  }
}
