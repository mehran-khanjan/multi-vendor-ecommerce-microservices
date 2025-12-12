// src/modules/authorization/casl-ability.factory.ts
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action, Subject, Role } from '@common/enums';
import { UserContext } from '@common/interfaces';

// Define subjects as classes for type safety (optional but recommended)
class CategorySubject {
  id: string;
}

class ProductSubject {
  id: string;
  vendorId?: string;
  isPublished?: boolean;
}

class VariantSubject {
  id: string;
  productId?: string;
}

class VendorProductSubject {
  id: string;
  vendorId: string;
}

class VendorVariantSubject {
  id: string;
  vendorId: string;
}

class InventorySubject {
  id: string;
  vendorId: string;
}

type Subjects =
  | InferSubjects<
      | typeof CategorySubject
      | typeof ProductSubject
      | typeof VariantSubject
      | typeof VendorProductSubject
      | typeof VendorVariantSubject
      | typeof InventorySubject
    >
  | Subject
  | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserContext | null): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>,
    );

    if (!user) {
      // ==========================================
      // GUEST (Unauthenticated) Permissions
      // ==========================================
      // Can only read published products and categories (public shop)
      can(Action.READ, Subject.CATEGORY);
      can(Action.READ, Subject.PRODUCT, { isPublished: true });
      can(Action.READ, Subject.VARIANT);
      can(Action.READ, Subject.VENDOR_PRODUCT, { isPublished: true });
      can(Action.READ, Subject.VENDOR_VARIANT);

      // Explicitly deny sensitive fields
      cannot(Action.READ_STOCK, Subject.INVENTORY);
      cannot(Action.READ_SKU, Subject.PRODUCT);
      cannot(Action.READ_COST, Subject.PRODUCT);

      return build({
        detectSubjectType: (item) =>
          item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    const roles = user.roles || [];

    // ==========================================
    // SUPER ADMIN - Full Access
    // ==========================================
    if (roles.includes(Role.SUPER_ADMIN)) {
      can(Action.MANAGE, 'all');
      return build({
        detectSubjectType: (item) =>
          item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    // ==========================================
    // ADMIN Permissions
    // ==========================================
    if (roles.includes(Role.ADMIN)) {
      // Full access to categories
      can(Action.MANAGE, Subject.CATEGORY);

      // Full access to products (admin creates master products)
      can(Action.MANAGE, Subject.PRODUCT);
      can(Action.READ_SKU, Subject.PRODUCT);
      can(Action.READ_COST, Subject.PRODUCT);
      can(Action.PUBLISH, Subject.PRODUCT);

      // Full access to variants (admin creates master variants)
      can(Action.MANAGE, Subject.VARIANT);

      // Read all vendor products
      can(Action.READ, Subject.VENDOR_PRODUCT);
      can(Action.READ, Subject.VENDOR_VARIANT);

      // Full access to inventory
      can(Action.MANAGE, Subject.INVENTORY);
      can(Action.READ_STOCK, Subject.INVENTORY);
      can(Action.UPDATE_STOCK, Subject.INVENTORY);
    }

    // ==========================================
    // VENDOR OWNER Permissions
    // ==========================================
    if (roles.includes(Role.VENDOR_OWNER)) {
      const vendorId = user.vendorId;

      // Read categories (cannot create/modify)
      can(Action.READ, Subject.CATEGORY);

      // Read all products and variants (master data)
      can(Action.READ, Subject.PRODUCT);
      can(Action.READ, Subject.VARIANT);

      // Cannot see SKU or cost price
      cannot(Action.READ_SKU, Subject.PRODUCT);
      cannot(Action.READ_COST, Subject.PRODUCT);

      // Full access to own vendor products
      can(Action.CREATE, Subject.VENDOR_PRODUCT);
      can(Action.READ, Subject.VENDOR_PRODUCT, { vendorId });
      can(Action.UPDATE, Subject.VENDOR_PRODUCT, { vendorId });
      can(Action.DELETE, Subject.VENDOR_PRODUCT, { vendorId });
      can(Action.SET_PRICE, Subject.VENDOR_PRODUCT, { vendorId });

      // Full access to own vendor variants
      can(Action.CREATE, Subject.VENDOR_VARIANT);
      can(Action.READ, Subject.VENDOR_VARIANT, { vendorId });
      can(Action.UPDATE, Subject.VENDOR_VARIANT, { vendorId });
      can(Action.DELETE, Subject.VENDOR_VARIANT, { vendorId });

      // Full access to own inventory
      can(Action.READ, Subject.INVENTORY, { vendorId });
      can(Action.READ_STOCK, Subject.INVENTORY, { vendorId });
      can(Action.UPDATE_STOCK, Subject.INVENTORY, { vendorId });
    }

    // ==========================================
    // VENDOR (Staff) Permissions
    // ==========================================
    if (roles.includes(Role.VENDOR) && !roles.includes(Role.VENDOR_OWNER)) {
      const vendorId = user.vendorId;

      // Read categories
      can(Action.READ, Subject.CATEGORY);

      // Read products and variants
      can(Action.READ, Subject.PRODUCT);
      can(Action.READ, Subject.VARIANT);

      // Cannot see SKU or cost price
      cannot(Action.READ_SKU, Subject.PRODUCT);
      cannot(Action.READ_COST, Subject.PRODUCT);

      // Read and update own vendor products (limited)
      can(Action.READ, Subject.VENDOR_PRODUCT, { vendorId });
      can(Action.UPDATE, Subject.VENDOR_PRODUCT, { vendorId });

      // Read own vendor variants
      can(Action.READ, Subject.VENDOR_VARIANT, { vendorId });
      can(Action.UPDATE, Subject.VENDOR_VARIANT, { vendorId });

      // Read stock but cannot update
      can(Action.READ, Subject.INVENTORY, { vendorId });
      can(Action.READ_STOCK, Subject.INVENTORY, { vendorId });
    }

    // ==========================================
    // CUSTOMER Permissions
    // ==========================================
    if (roles.includes(Role.CUSTOMER)) {
      // Read categories
      can(Action.READ, Subject.CATEGORY);

      // Read published products only
      can(Action.READ, Subject.PRODUCT, { isPublished: true });
      can(Action.READ, Subject.VARIANT);

      // Read vendor products (for shop display)
      can(Action.READ, Subject.VENDOR_PRODUCT, { isPublished: true });
      can(Action.READ, Subject.VENDOR_VARIANT);

      // Explicitly deny stock and sensitive fields
      cannot(Action.READ_STOCK, Subject.INVENTORY);
      cannot(Action.READ_SKU, Subject.PRODUCT);
      cannot(Action.READ_COST, Subject.PRODUCT);
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
