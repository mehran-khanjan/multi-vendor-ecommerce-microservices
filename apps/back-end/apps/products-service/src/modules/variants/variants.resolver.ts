// src/modules/variants/variants.resolver.ts
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
} from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { Variant } from './entities/variant.entity';
import { CreateVariantInput, UpdateVariantInput } from './dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import { Public, RequirePermissions, CurrentUser } from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';
import { FieldFilterInterceptor } from '@common/interceptors';
import { AuthorizationService } from '@modules/authorization/authorization.service';

@Resolver(() => Variant)
@UseInterceptors(FieldFilterInterceptor)
export class VariantsResolver {
  constructor(
    private readonly variantsService: VariantsService,
    private readonly authService: AuthorizationService,
  ) {}

  // ==========================================
  // PUBLIC QUERIES
  // ==========================================

  @Public()
  @Query(() => [Variant], { name: 'productVariants' })
  async getProductVariants(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<Variant[]> {
    return this.variantsService.findActiveByProductId(productId);
  }

  // ==========================================
  // ADMIN QUERIES
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.VARIANT })
  @Query(() => Variant, { name: 'adminVariant' })
  async getAdminVariant(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Variant> {
    return this.variantsService.findById(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.VARIANT })
  @Query(() => [Variant], { name: 'adminProductVariants' })
  async getAdminProductVariants(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<Variant[]> {
    return this.variantsService.findByProductId(productId);
  }

  // ==========================================
  // ADMIN MUTATIONS
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.CREATE, subject: Subject.VARIANT })
  @Mutation(() => Variant)
  async createVariant(
    @Args('input') input: CreateVariantInput,
    @CurrentUser() user: UserContext,
  ): Promise<Variant> {
    return this.variantsService.create(input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.UPDATE, subject: Subject.VARIANT })
  @Mutation(() => Variant)
  async updateVariant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVariantInput,
    @CurrentUser() user: UserContext,
  ): Promise<Variant> {
    return this.variantsService.update(id, input, user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.DELETE, subject: Subject.VARIANT })
  @Mutation(() => Boolean)
  async deleteVariant(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<boolean> {
    return this.variantsService.delete(id, user);
  }

  // ==========================================
  // FIELD RESOLVERS with Access Control
  // ==========================================

  @ResolveField('sku', () => String, { nullable: true })
  resolveSku(@Parent() variant: Variant, @Context() ctx: any): string | null {
    const user = ctx.req?.context?.user;

    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_SKU, Subject.VARIANT)
    ) {
      return null;
    }

    return variant.sku;
  }

  @ResolveField('costPrice', () => Number, { nullable: true })
  resolveCostPrice(
    @Parent() variant: Variant,
    @Context() ctx: any,
  ): number | null {
    const user = ctx.req?.context?.user;

    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_COST, Subject.VARIANT)
    ) {
      return null;
    }

    return variant.costPrice;
  }

  // ==========================================
  // Federation
  // ==========================================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<Variant> {
    return this.variantsService.findById(reference.id);
  }
}
