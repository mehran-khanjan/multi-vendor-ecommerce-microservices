// src/modules/categories/categories.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveReference,
} from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import {
  Public,
  RequirePermissions,
  CanManage,
  CurrentUser,
} from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';
import { FieldFilterInterceptor } from '@common/interceptors';

@Resolver(() => Category)
@UseInterceptors(FieldFilterInterceptor)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ==========================================
  // PUBLIC QUERIES (Shop)
  // ==========================================

  @Public()
  @Query(() => [Category], { name: 'categories' })
  async getCategories(): Promise<Category[]> {
    return this.categoriesService.findAll(false); // Only active
  }

  @Public()
  @Query(() => [Category], { name: 'categoryTree' })
  async getCategoryTree(): Promise<Category[]> {
    return this.categoriesService.findTree();
  }

  @Public()
  @Query(() => Category, { name: 'category' })
  async getCategory(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Category> {
    return this.categoriesService.findById(id);
  }

  @Public()
  @Query(() => Category, { name: 'categoryBySlug' })
  async getCategoryBySlug(@Args('slug') slug: string): Promise<Category> {
    return this.categoriesService.findBySlug(slug);
  }

  @Public()
  @Query(() => [Category], { name: 'featuredCategories' })
  async getFeaturedCategories(): Promise<Category[]> {
    return this.categoriesService.getFeaturedCategories();
  }

  // ==========================================
  // ADMIN ONLY - Category Management
  // ==========================================

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.READ, subject: Subject.CATEGORY })
  @Query(() => [Category], { name: 'allCategories' })
  async getAllCategories(): Promise<Category[]> {
    return this.categoriesService.findAll(true); // Include inactive
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.CREATE, subject: Subject.CATEGORY })
  @Mutation(() => Category)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
    @CurrentUser() user: UserContext,
  ): Promise<Category> {
    return this.categoriesService.create(input);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.UPDATE, subject: Subject.CATEGORY })
  @Mutation(() => Category)
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateCategoryInput,
  ): Promise<Category> {
    return this.categoriesService.update(id, input);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ action: Action.DELETE, subject: Subject.CATEGORY })
  @Mutation(() => Boolean)
  async deleteCategory(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.categoriesService.delete(id);
  }

  // ==========================================
  // Federation
  // ==========================================

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<Category> {
    return this.categoriesService.findById(reference.id);
  }
}
