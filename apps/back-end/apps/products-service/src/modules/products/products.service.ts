// src/modules/products/products.service.ts (continued)
import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { Product, ProductStatus } from './entities/product.entity';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from './dto';
import { PaginationInput, PaginationMeta } from '@common/dto';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { UserContext } from '@common/interfaces';
import { Action, Subject } from '@common/enums';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly authService: AuthorizationService,
  ) {}

  // ==========================================
  // Public Methods (Shop)
  // ==========================================

  async findPublishedProducts(
    filter: ProductFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ products: Product[]; meta: PaginationMeta }> {
    return this.productsRepository.findAll(filter, pagination, true);
  }

  async findPublishedProductBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findBySlug(slug);

    if (
      !product ||
      !product.isPublished ||
      product.status !== ProductStatus.ACTIVE
    ) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    return this.productsRepository.getFeaturedProducts(limit);
  }

  // ==========================================
  // Admin Methods
  // ==========================================

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findAll(
    filter: ProductFilterInput = {},
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ products: Product[]; meta: PaginationMeta }> {
    return this.productsRepository.findAll(filter, pagination, false);
  }

  async create(input: CreateProductInput, user: UserContext): Promise<Product> {
    // Only admin can create products
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can create products');
    }

    const slug =
      input.slug || slugify(input.name, { lower: true, strict: true });

    // Check for duplicate slug
    const existing = await this.productsRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Product with this slug already exists');
    }

    const product = await this.productsRepository.create({
      ...input,
      slug,
      status: ProductStatus.DRAFT,
      isPublished: false,
    });

    // Add images if provided
    if (input.images && input.images.length > 0) {
      await this.productsRepository.addImages(product.id, input.images);
    }

    this.logger.log(
      `Product created by admin ${user.id}: ${product.id} (${product.name})`,
    );

    return this.findById(product.id);
  }

  async update(
    id: string,
    input: UpdateProductInput,
    user: UserContext,
  ): Promise<Product> {
    // Only admin can update products
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can update products');
    }

    const product = await this.findById(id);

    // Handle slug change
    if (input.slug && input.slug !== product.slug) {
      const existing = await this.productsRepository.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new Error('Product with this slug already exists');
      }
    }

    // If publishing, set published date
    if (input.isPublished && !product.isPublished) {
      (input as any).publishedAt = new Date();
    }

    await this.productsRepository.update(id, input);

    this.logger.log(`Product updated by admin ${user.id}: ${id}`);

    return this.findById(id);
  }

  async delete(id: string, user: UserContext): Promise<boolean> {
    // Only admin can delete products
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can delete products');
    }

    await this.findById(id); // Ensure exists
    await this.productsRepository.delete(id);

    this.logger.log(`Product deleted by admin ${user.id}: ${id}`);

    return true;
  }

  async publish(id: string, user: UserContext): Promise<Product> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only administrators can publish products');
    }

    const product = await this.findById(id);

    await this.productsRepository.update(id, {
      isPublished: true,
      status: ProductStatus.ACTIVE,
      publishedAt: new Date(),
    });

    this.logger.log(`Product published by admin ${user.id}: ${id}`);

    return this.findById(id);
  }

  async unpublish(id: string, user: UserContext): Promise<Product> {
    if (!this.authService.isAdmin(user)) {
      throw new ForbiddenException(
        'Only administrators can unpublish products',
      );
    }

    await this.findById(id);

    await this.productsRepository.update(id, {
      isPublished: false,
      status: ProductStatus.INACTIVE,
    });

    this.logger.log(`Product unpublished by admin ${user.id}: ${id}`);

    return this.findById(id);
  }

  // ==========================================
  // Field Access Control
  // ==========================================

  /**
   * Filter product data based on user permissions
   * Removes fields that user cannot access
   */
  filterProductForUser(
    product: Product,
    user: UserContext | null,
  ): Partial<Product> {
    const filtered = { ...product } as any;

    // Remove SKU for non-admins
    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_SKU, Subject.PRODUCT)
    ) {
      delete filtered.sku;
    }

    // Remove cost price for non-admins
    if (
      !user ||
      !this.authService.checkPermission(user, Action.READ_COST, Subject.PRODUCT)
    ) {
      delete filtered.costPrice;
    }

    return filtered;
  }

  /**
   * Filter array of products
   */
  filterProductsForUser(
    products: Product[],
    user: UserContext | null,
  ): Partial<Product>[] {
    return products.map((product) => this.filterProductForUser(product, user));
  }
}
