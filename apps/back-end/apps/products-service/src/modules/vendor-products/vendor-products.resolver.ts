// src/modules/vendor-products/vendor-products.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
  ResolveReference,
  Int,
} from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { VendorProductsService } from './vendor-products.service';
import { VendorProduct } from './entities/vendor-product.entity';
import { VendorVariant } from './entities/vendor-variant.entity';
import {
  AddVendorProductInput,
  UpdateVendorProductInput,
  UpdateVendorVariantInput,
} from './dto';
import {
  PaginationInput,
  PaginationMeta,
  createPaginatedResponse,
} from '@common/dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import { Public, RequirePermissions, CurrentUser } from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';
import { FieldFilterInterceptor } from '@common/interceptors';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class PaginatedVendorProductsResponse extends createPaginatedResponse(
  VendorProduct,
) {}

@Resolver(() => VendorProduct)
@UseInterceptors(FieldFilterInterceptor)
export class VendorProductsResolver {
  constructor(
    private readonly vendorProductsService: VendorProductsService,
    private readonly authService: AuthorizationService,
  ) {}

  // ==========================================
  // PUBLIC QUERIES (Shop)
  // ==========================================

  @Public()
  @Query(() => [VendorProduct], { name: 'productOffers' })
  async getProductOffers(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<VendorProduct[]> {
    return this.vendorProductsService.findPublishedByProductId(productId);
  }

  @Public()
  @Query(() => VendorProduct, { name: 'lowestPriceOffer', nullable: true })
  async getLowestPriceOffer(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<VendorProduct | null> {
    return this.vendorProductsService.findLowestPriceForProduct(productId);
  }

  // ==========================================
  // VENDOR QUERIES
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.VENDOR_PRODUCT })
  @Query(() => PaginatedVendorProductsResponse, { name: 'myVendorProducts' })
  async getMyVendorProducts(
    @CurrentUser() user: UserContext,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: VendorProduct[]; meta: PaginationMeta }> {
    if (!user.vendorId) {
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 20,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const result = await this.vendorProductsService.findByVendorId(
      user.vendorId,
      pagination || { page: 1, limit: 20 },
    );
    return { items: result.vendorProducts, meta: result.meta };
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.VENDOR_PRODUCT })
  @Query(() => VendorProduct, { name: 'myVendorProduct' })
  async getMyVendorProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    const vendorProduct = await this.vendorProductsService.findById(id);

    // Vendors can only see their own products
    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new Error('Access denied');
    }

    return vendorProduct;
  }

  // ==========================================
  // VENDOR MUTATIONS
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.CREATE,
    subject: Subject.VENDOR_PRODUCT,
  })
  @Mutation(() => VendorProduct)
  async addVendorProduct(
    @Args('input') input: AddVendorProductInput,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    return this.vendorProductsService.addVendorProduct(input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE,
    subject: Subject.VENDOR_PRODUCT,
  })
  @Mutation(() => VendorProduct)
  async updateVendorProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVendorProductInput,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    return this.vendorProductsService.updateVendorProduct(id, input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.DELETE,
    subject: Subject.VENDOR_PRODUCT,
  })
  @Mutation(() => Boolean)
  async deleteVendorProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<boolean> {
    return this.vendorProductsService.deleteVendorProduct(id, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE,
    subject: Subject.VENDOR_PRODUCT,
  })
  @Mutation(() => VendorProduct)
  async publishVendorProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    return this.vendorProductsService.publishVendorProduct(id, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE,
    subject: Subject.VENDOR_PRODUCT,
  })
  @Mutation(() => VendorProduct)
  async unpublishVendorProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    return this.vendorProductsService.unpublishVendorProduct(id, user);
  }

  // ==========================================
  // VENDOR VARIANT MUTATIONS
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE,
    subject: Subject.VENDOR_VARIANT,
  })
  @Mutation(() => VendorVariant)
  async updateVendorVariant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVendorVariantInput,
    @CurrentUser() user: UserContext,
  ): Promise<VendorVariant> {
    return this.vendorProductsService.updateVendorVariant(id, input, user);
  }

  // ==========================================
  // STOCK MANAGEMENT
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE_STOCK,
    subject: Subject.INVENTORY,
  })
  @Mutation(() => VendorProduct)
  async updateVendorProductStock(
    @Args('id', { type: () => ID }) id: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @CurrentUser() user: UserContext,
  ): Promise<VendorProduct> {
    return this.vendorProductsService.updateStock(id, quantity, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({
    action: Action.UPDATE_STOCK,
    subject: Subject.INVENTORY,
  })
  @Mutation(() => VendorVariant)
  async updateVendorVariantStock(
    @Args('id', { type: () => ID }) id: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @CurrentUser() user: UserContext,
  ): Promise<VendorVariant> {
    return this.vendorProductsService.updateVariantStock(id, quantity, user);
  }

  // ==========================================
  // FIELD RESOLVERS with Access Control
  // ==========================================

  @ResolveField('stockQuantity', () => Int, { nullable: true })
  resolveStockQuantity(
    @Parent() vendorProduct: VendorProduct,
    @Context() ctx: any,
  ): number | null {
    const user = ctx.req?.context?.user;

    // Only vendor and admin can see stock
    if (!user) return null;

    if (
      !this.authService.checkPermission(
        user,
        Action.READ_STOCK,
        Subject.INVENTORY,
        { vendorId: vendorProduct.vendorId },
      )
    ) {
      return null;
    }

    return vendorProduct.stockQuantity;
  }

  @ResolveField('lowStockThreshold', () => Int, { nullable: true })
  resolveLowStockThreshold(
    @Parent() vendorProduct: VendorProduct,
    @Context() ctx: any,
  ): number | null {
    const user = ctx.req?.context?.user;

    if (!user) return null;

    if (
      !this.authService.checkPermission(
        user,
        Action.READ_STOCK,
        Subject.INVENTORY,
        { vendorId: vendorProduct.vendorId },
      )
    ) {
      return null;
    }

    return vendorProduct.lowStockThreshold;
  }

  @ResolveField('purchasePrice', () => Number, { nullable: true })
  resolvePurchasePrice(
    @Parent() vendorProduct: VendorProduct,
    @Context() ctx: any,
  ): number | null {
    const user = ctx.req?.context?.user;

    // Only vendor owner and admin can see purchase price
    if (!user) return null;

    if (
      !this.authService.isAdmin(user) &&
      !this.authService.isVendorOwner(user, vendorProduct.vendorId)
    ) {
      return null;
    }

    return vendorProduct.purchasePrice;
  }

  // ==========================================
  // Federation
  // ==========================================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<VendorProduct> {
    return this.vendorProductsService.findById(reference.id);
  }
}
