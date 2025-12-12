// src/modules/products/products.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveReference,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
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
class PaginatedProductsResponse extends createPaginatedResponse(Product) {}

@Resolver(() => Product)
@UseInterceptors(FieldFilterInterceptor)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly authService: AuthorizationService,
  ) {}

  // ==========================================
  // PUBLIC QUERIES (Shop - /shop, /shop/[slug])
  // ==========================================

  @Public()
  @Query(() => PaginatedProductsResponse, { name: 'shopProducts' })
  async getShopProducts(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: Product[]; meta: PaginationMeta }> {
    const result = await this.productsService.findPublishedProducts(
      filter || {},
      pagination || { page: 1, limit: 20 },
    );
    return { items: result.products, meta: result.meta };
  }

  @Public()
  @Query(() => Product, { name: 'shopProduct' })
  async getShopProduct(@Args('slug') slug: string): Promise<Product> {
    return this.productsService.findPublishedProductBySlug(slug);
  }

  @Public()
  @Query(() => [Product], { name: 'featuredProducts' })
  async getFeaturedProducts(
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<Product[]> {
    return this.productsService.getFeaturedProducts(limit);
  }

  // ==========================================
  // ADMIN QUERIES
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.PRODUCT })
  @Query(() => PaginatedProductsResponse, { name: 'adminProducts' })
  async getAdminProducts(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<{ items: Product[]; meta: PaginationMeta }> {
    const result = await this.productsService.findAll(
      filter || {},
      pagination || { page: 1, limit: 20 },
    );
    return { items: result.products, meta: result.meta };
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.PRODUCT })
  @Query(() => Product, { name: 'adminProduct' })
  async getAdminProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Product> {
    return this.productsService.findById(id);
  }

  // ==========================================
  // ADMIN MUTATIONS - Only admin can create/update/delete products
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.CREATE, subject: Subject.PRODUCT })
  @Mutation(() => Product)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() user: UserContext,
  ): Promise<Product> {
    return this.productsService.create(input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.UPDATE, subject: Subject.PRODUCT })
  @Mutation(() => Product)
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
    @CurrentUser() user: UserContext,
  ): Promise<Product> {
    return this.productsService.update(id, input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.DELETE, subject: Subject.PRODUCT })
  @Mutation(() => Boolean)
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<boolean> {
    return this.productsService.delete(id, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.PUBLISH, subject: Subject.PRODUCT })
  @Mutation(() => Product)
  async publishProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<Product> {
    return this.productsService.publish(id, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.PUBLISH, subject: Subject.PRODUCT })
  @Mutation(() => Product)
  async unpublishProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<Product> {
    return this.productsService.unpublish(id, user);
  }

  // ==========================================
  // FIELD RESOLVERS with Access Control
  // ==========================================

  /**
   * SKU field - only visible to admin
   */
  @ResolveField('sku', () => String, { nullable: true })
  resolveSku(@Parent() product: Product, @Context() ctx: any): string | null {
    const user = ctx.req?.context?.user;

    // Only admin can see SKU
    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_SKU, Subject.PRODUCT)
    ) {
      return null;
    }

    return product.sku;
  }

  /**
   * Cost price field - only visible to admin
   */
  @ResolveField('costPrice', () => Number, { nullable: true })
  resolveCostPrice(
    @Parent() product: Product,
    @Context() ctx: any,
  ): number | null {
    const user = ctx.req?.context?.user;

    // Only admin can see cost price
    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_COST, Subject.PRODUCT)
    ) {
      return null;
    }

    return product.costPrice;
  }

  // ==========================================
  // Federation
  // ==========================================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<Product> {
    return this.productsService.findById(reference.id);
  }
}
