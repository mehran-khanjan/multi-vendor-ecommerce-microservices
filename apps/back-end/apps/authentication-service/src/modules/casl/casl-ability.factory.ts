// src/modules/casl/casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
} from '@casl/ability';
import { Action, Subject } from '@common/enums';
import { User } from '@modules/users/entities/user.entity';

// Define all possible subjects
type Subjects = InferSubjects<
  | typeof User
  | 'User'
  | 'Role'
  | 'Permission'
  | 'Session'
  | 'Product'
  | 'Order'
  | 'Vendor'
  | 'Category'
  | 'Review'
  | 'Analytics'
  | 'Settings'
  | 'all'
>;

export type AppAbility = Ability<[Action, Subjects]>;

interface PermissionRule {
  action: Action | Action[];
  subject: Subjects | Subjects[];
  conditions?: Record<string, any>;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>,
    );

    // Super admin can do everything
    if (user.hasRole('super_admin')) {
      can(Action.MANAGE, 'all');
      return build({
        detectSubjectType: (item) =>
          item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    // Admin role
    if (user.hasRole('admin')) {
      can(Action.MANAGE, Subject.USER);
      can(Action.MANAGE, Subject.ROLE);
      can(Action.MANAGE, Subject.PERMISSION);
      can(Action.MANAGE, Subject.SESSION);
      can(Action.MANAGE, Subject.CATEGORY);
      can(Action.MANAGE, Subject.VENDOR);
      can(Action.READ, Subject.ANALYTICS);
      can(Action.READ, Subject.SETTINGS);
      can(Action.UPDATE, Subject.SETTINGS);
    }

    // Vendor role
    if (user.hasRole('vendor') || user.hasRole('vendor_owner')) {
      // Vendors can manage their own products
      can(Action.CREATE, Subject.PRODUCT);
      can(Action.READ, Subject.PRODUCT, { vendorId: user.vendorId });
      can(Action.UPDATE, Subject.PRODUCT, { vendorId: user.vendorId });
      can(Action.DELETE, Subject.PRODUCT, { vendorId: user.vendorId });

      // Vendors can view their orders
      can(Action.READ, Subject.ORDER, { vendorId: user.vendorId });
      can(Action.UPDATE, Subject.ORDER, { vendorId: user.vendorId });

      // Vendors can view their analytics
      can(Action.READ, Subject.ANALYTICS, { vendorId: user.vendorId });

      // Vendor owners can manage vendor settings
      if (user.hasRole('vendor_owner')) {
        can(Action.MANAGE, Subject.VENDOR, { id: user.vendorId });
      }
    }

    // Customer role - basic permissions
    if (user.hasRole('customer')) {
      // Can read public resources
      can(Action.READ, Subject.PRODUCT);
      can(Action.READ, Subject.CATEGORY);
      can(Action.READ, Subject.VENDOR);

      // Can manage own orders
      can(Action.CREATE, Subject.ORDER);
      can(Action.READ, Subject.ORDER, { userId: user.id });

      // Can manage own reviews
      can(Action.CREATE, Subject.REVIEW);
      can(Action.READ, Subject.REVIEW, { userId: user.id });
      can(Action.UPDATE, Subject.REVIEW, { userId: user.id });
      can(Action.DELETE, Subject.REVIEW, { userId: user.id });
    }

    // Parse dynamic permissions from database
    this.applyDynamicPermissions(user, can, cannot);

    // All authenticated users can manage their own profile
    can(Action.READ, Subject.USER, { id: user.id });
    can(Action.UPDATE, Subject.USER, { id: user.id });

    // All authenticated users can manage their own sessions
    can(Action.READ, Subject.SESSION, { userId: user.id });
    can(Action.DELETE, Subject.SESSION, { userId: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  private applyDynamicPermissions(
    user: User,
    can: AbilityBuilder<AppAbility>['can'],
    cannot: AbilityBuilder<AppAbility>['cannot'],
  ): void {
    // Parse permissions from user's roles
    const permissions = user.permissions;

    for (const permissionSlug of permissions) {
      const [resource, action, scope] = permissionSlug.split(':');

      if (!resource || !action) continue;

      const actionEnum = this.mapActionString(action);
      const subjectEnum = this.mapSubjectString(resource);

      if (actionEnum && subjectEnum) {
        if (scope === 'own') {
          // Apply ownership condition
          can(actionEnum, subjectEnum, { userId: user.id });
        } else if (scope === 'tenant' && user.tenantId) {
          // Apply tenant condition
          can(actionEnum, subjectEnum, { tenantId: user.tenantId });
        } else if (scope === 'vendor' && user.vendorId) {
          // Apply vendor condition
          can(actionEnum, subjectEnum, { vendorId: user.vendorId });
        } else {
          // No scope restriction
          can(actionEnum, subjectEnum);
        }
      }
    }
  }

  private mapActionString(action: string): Action | null {
    const actionMap: Record<string, Action> = {
      create: Action.CREATE,
      read: Action.READ,
      update: Action.UPDATE,
      delete: Action.DELETE,
      manage: Action.MANAGE,
    };
    return actionMap[action.toLowerCase()] || null;
  }

  private mapSubjectString(resource: string): Subject | null {
    const subjectMap: Record<string, Subject> = {
      user: Subject.USER,
      role: Subject.ROLE,
      permission: Subject.PERMISSION,
      session: Subject.SESSION,
      product: Subject.PRODUCT,
      order: Subject.ORDER,
      vendor: Subject.VENDOR,
      category: Subject.CATEGORY,
      review: Subject.REVIEW,
      analytics: Subject.ANALYTICS,
      settings: Subject.SETTINGS,
      all: Subject.ALL,
    };
    return subjectMap[resource.toLowerCase()] || null;
  }

  // Helper method to check permissions
  checkAbility(
    user: User,
    action: Action,
    subject: Subjects,
    subjectData?: any,
  ): boolean {
    const ability = this.createForUser(user);
    return ability.can(action, subjectData || subject);
  }
}
