// src/modules/authorization/authorization.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { UserContext, Permission } from '@common/interfaces';
import { Action, Subject } from '@common/enums';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  /**
   * Check if user has a specific permission
   */
  checkPermission(
    user: UserContext,
    action: Action | string,
    subject: Subject | string,
    conditions?: Record<string, any>,
  ): boolean {
    if (!user || !user.permissions) {
      return false;
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }

    return user.permissions.some((permission) => {
      // Check action match
      const actionMatch =
        permission.action === action ||
        permission.action === Action.MANAGE ||
        permission.action === 'manage';

      // Check subject match
      const subjectMatch =
        permission.subject === subject ||
        permission.subject === Subject.ALL ||
        permission.subject === 'all';

      if (!actionMatch || !subjectMatch) {
        return false;
      }

      // Check conditions if present
      if (permission.conditions && conditions) {
        try {
          const permConditions =
            typeof permission.conditions === 'string'
              ? JSON.parse(permission.conditions)
              : permission.conditions;

          return this.matchConditions(permConditions, conditions);
        } catch {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if user is an admin
   */
  isAdmin(user: UserContext): boolean {
    return user?.role === 'admin';
  }

  /**
   * Check if user is a vendor
   */
  isVendor(user: UserContext): boolean {
    return user?.role === 'vendor' && !!user.vendorId;
  }

  /**
   * Check if user is a customer
   */
  isCustomer(user: UserContext): boolean {
    return user?.role === 'customer';
  }

  /**
   * Check if user owns a resource
   */
  isOwner(user: UserContext, resourceUserId: string): boolean {
    return user?.id === resourceUserId;
  }

  /**
   * Check if vendor can access vendor-specific data
   */
  isVendorOwner(user: UserContext, vendorId: string): boolean {
    return (
      this.isAdmin(user) || (this.isVendor(user) && user.vendorId === vendorId)
    );
  }

  /**
   * Check if user can access their own data or is admin
   */
  canAccessUserData(user: UserContext, targetUserId: string): boolean {
    return this.isAdmin(user) || this.isOwner(user, targetUserId);
  }

  /**
   * Check if user can access vendor data
   */
  canAccessVendorData(user: UserContext, vendorId: string): boolean {
    return this.isAdmin(user) || this.isVendorOwner(user, vendorId);
  }

  /**
   * Match permission conditions with resource conditions
   */
  private matchConditions(
    permConditions: Record<string, any>,
    resourceConditions: Record<string, any>,
  ): boolean {
    for (const [key, value] of Object.entries(permConditions)) {
      if (resourceConditions[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
