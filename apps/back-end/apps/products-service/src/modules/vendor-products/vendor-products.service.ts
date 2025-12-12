// src/modules/vendor-products/vendor-products.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VendorProduct,
  VendorProductStatus,
} from './entities/vendor-product.entity';
import { VendorVariant } from './entities/vendor-variant.entity';
import {
  AddVendorProductInput,
  UpdateVendorProductInput,
  UpdateVendorVariantInput,
} from './dto';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { ProductsService } from '@modules/products/products.service';
import { UserContext } from '@common/interfaces';
import { Action, Subject } from '@common/enums';
import { PaginationInput, PaginationMeta } from '@common/dto';

@Injectable()
export class VendorProductsService {
  private readonly logger = new Logger(VendorProductsService.name);

  constructor(
    @InjectRepository(VendorProduct)
    private readonly vendorProductRepository: Repository<VendorProduct>,
    @InjectRepository(VendorVariant)
    private readonly vendorVariantRepository: Repository<VendorVariant>,
    private readonly authService: AuthorizationService,
    private readonly productsService: ProductsService,
  ) {}

  // ==========================================
  // Public Methods (Shop)
  // ==========================================

  async findPublishedByProductId(productId: string): Promise<VendorProduct[]> {
    return this.vendorProductRepository.find({
      where: {
        productId,
        isPublished: true,
        status: VendorProductStatus.ACTIVE,
      },
      relations: ['product', 'vendorVariants', 'vendorVariants.variant'],
      order: { price: 'ASC' },
    });
  }

  async findLowestPriceForProduct(
    productId: string,
  ): Promise<VendorProduct | null> {
    return this.vendorProductRepository.findOne({
      where: {
        productId,
        isPublished: true,
        status: VendorProductStatus.ACTIVE,
      },
      order: { price: 'ASC' },
    });
  }

  // ==========================================
  // Vendor Methods
  // ==========================================

  async findById(id: string): Promise<VendorProduct> {
    const vendorProduct = await this.vendorProductRepository.findOne({
      where: { id },
      relations: ['product', 'vendorVariants', 'vendorVariants.variant'],
    });

    if (!vendorProduct) {
      throw new NotFoundException('Vendor product not found');
    }

    return vendorProduct;
  }

  async findByVendorId(
    vendorId: string,
    pagination: PaginationInput = { page: 1, limit: 20 },
  ): Promise<{ vendorProducts: VendorProduct[]; meta: PaginationMeta }> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [vendorProducts, totalItems] =
      await this.vendorProductRepository.findAndCount({
        where: { vendorId },
        relations: ['product', 'product.category', 'vendorVariants'],
        skip,
        take: pagination.limit,
        order: { createdAt: 'DESC' },
      });

    const meta: PaginationMeta = {
      totalItems,
      itemCount: vendorProducts.length,
      itemsPerPage: pagination.limit,
      totalPages: Math.ceil(totalItems / pagination.limit),
      currentPage: pagination.page,
      hasNextPage: pagination.page < Math.ceil(totalItems / pagination.limit),
      hasPreviousPage: pagination.page > 1,
    };

    return { vendorProducts, meta };
  }

  async addVendorProduct(
    input: AddVendorProductInput,
    user: UserContext,
  ): Promise<VendorProduct> {
    // Verify user is a vendor
    if (!this.authService.isVendor(user) && !this.authService.isAdmin(user)) {
      throw new ForbiddenException('Only vendors can add vendor products');
    }

    const vendorId = user.vendorId;
    if (!vendorId && !this.authService.isAdmin(user)) {
      throw new ForbiddenException('Vendor ID is required');
    }

    // Verify product exists
    await this.productsService.findById(input.productId);

    // Check if vendor already has this product
    const existing = await this.vendorProductRepository.findOne({
      where: { vendorId, productId: input.productId },
    });

    if (existing) {
      throw new Error('You have already added this product');
    }

    // Create vendor product
    const vendorProduct = this.vendorProductRepository.create({
      vendorId,
      productId: input.productId,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      purchasePrice: input.purchasePrice,
      currency: input.currency || 'USD',
      stockQuantity: input.stockQuantity || 0,
      lowStockThreshold: input.lowStockThreshold || 5,
      trackInventory: input.trackInventory ?? true,
      allowBackorder: input.allowBackorder ?? false,
      vendorSku: input.vendorSku,
      handlingTime: input.handlingTime,
      status: VendorProductStatus.DRAFT,
      isPublished: false,
    });

    const saved = await this.vendorProductRepository.save(vendorProduct);

    // Add vendor variants if provided
    if (input.variants && input.variants.length > 0) {
      const vendorVariants = input.variants.map((v) =>
        this.vendorVariantRepository.create({
          vendorProductId: saved.id,
          vendorId,
          variantId: v.variantId,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stockQuantity || 0,
          vendorSku: v.vendorSku,
          isActive: v.isActive ?? true,
        }),
      );
      await this.vendorVariantRepository.save(vendorVariants);
    }

    this.logger.log(`Vendor product added by vendor ${vendorId}: ${saved.id}`);

    return this.findById(saved.id);
  }

  async updateVendorProduct(
    id: string,
    input: UpdateVendorProductInput,
    user: UserContext,
  ): Promise<VendorProduct> {
    const vendorProduct = await this.findById(id);

    // Check ownership
    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Update fields
    Object.assign(vendorProduct, input);

    await this.vendorProductRepository.save(vendorProduct);

    this.logger.log(`Vendor product updated by ${user.id}: ${id}`);

    return this.findById(id);
  }

  async updateVendorVariant(
    id: string,
    input: UpdateVendorVariantInput,
    user: UserContext,
  ): Promise<VendorVariant> {
    const vendorVariant = await this.vendorVariantRepository.findOne({
      where: { id },
      relations: ['vendorProduct'],
    });

    if (!vendorVariant) {
      throw new NotFoundException('Vendor variant not found');
    }

    // Check ownership
    if (!this.authService.canAccessVendorData(user, vendorVariant.vendorId)) {
      throw new ForbiddenException('You can only update your own variants');
    }

    Object.assign(vendorVariant, input);

    await this.vendorVariantRepository.save(vendorVariant);

    this.logger.log(`Vendor variant updated by ${user.id}: ${id}`);

    return vendorVariant;
  }

  async deleteVendorProduct(id: string, user: UserContext): Promise<boolean> {
    const vendorProduct = await this.findById(id);

    // Check ownership
    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.vendorProductRepository.softDelete(id);

    this.logger.log(`Vendor product deleted by ${user.id}: ${id}`);

    return true;
  }

  async publishVendorProduct(
    id: string,
    user: UserContext,
  ): Promise<VendorProduct> {
    const vendorProduct = await this.findById(id);

    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new ForbiddenException('You can only publish your own products');
    }

    vendorProduct.isPublished = true;
    vendorProduct.status = VendorProductStatus.ACTIVE;

    await this.vendorProductRepository.save(vendorProduct);

    this.logger.log(`Vendor product published by ${user.id}: ${id}`);

    return vendorProduct;
  }

  async unpublishVendorProduct(
    id: string,
    user: UserContext,
  ): Promise<VendorProduct> {
    const vendorProduct = await this.findById(id);

    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new ForbiddenException('You can only unpublish your own products');
    }

    vendorProduct.isPublished = false;
    vendorProduct.status = VendorProductStatus.INACTIVE;

    await this.vendorProductRepository.save(vendorProduct);

    this.logger.log(`Vendor product unpublished by ${user.id}: ${id}`);

    return vendorProduct;
  }

  // ==========================================
  // Stock Management
  // ==========================================

  async updateStock(
    id: string,
    quantity: number,
    user: UserContext,
  ): Promise<VendorProduct> {
    const vendorProduct = await this.findById(id);

    if (!this.authService.canAccessVendorData(user, vendorProduct.vendorId)) {
      throw new ForbiddenException(
        'You can only update stock for your own products',
      );
    }

    vendorProduct.stockQuantity = quantity;

    // Auto-update status based on stock
    if (quantity <= 0 && vendorProduct.status === VendorProductStatus.ACTIVE) {
      vendorProduct.status = VendorProductStatus.OUT_OF_STOCK;
    } else if (
      quantity > 0 &&
      vendorProduct.status === VendorProductStatus.OUT_OF_STOCK
    ) {
      vendorProduct.status = VendorProductStatus.ACTIVE;
    }

    await this.vendorProductRepository.save(vendorProduct);

    this.logger.log(`Stock updated for vendor product ${id}: ${quantity}`);

    return vendorProduct;
  }

  async updateVariantStock(
    id: string,
    quantity: number,
    user: UserContext,
  ): Promise<VendorVariant> {
    const vendorVariant = await this.vendorVariantRepository.findOne({
      where: { id },
    });

    if (!vendorVariant) {
      throw new NotFoundException('Vendor variant not found');
    }

    if (!this.authService.canAccessVendorData(user, vendorVariant.vendorId)) {
      throw new ForbiddenException(
        'You can only update stock for your own variants',
      );
    }

    vendorVariant.stockQuantity = quantity;

    await this.vendorVariantRepository.save(vendorVariant);

    this.logger.log(`Stock updated for vendor variant ${id}: ${quantity}`);

    return vendorVariant;
  }

  // ==========================================
  // Field Access Control
  // ==========================================

  filterVendorProductForUser(
    vendorProduct: VendorProduct,
    user: UserContext | null,
  ): Partial<VendorProduct> {
    const filtered = { ...vendorProduct } as any;

    // Stock is only visible to vendor and admin
    if (
      !user ||
      !this.authService.checkPermission(
        user,
        Action.READ_STOCK,
        Subject.INVENTORY,
        { vendorId: vendorProduct.vendorId },
      )
    ) {
      delete filtered.stockQuantity;
      delete filtered.lowStockThreshold;
    }

    // Purchase price is only visible to vendor owner and admin
    if (
      !user ||
      (!this.authService.isAdmin(user) &&
        !this.authService.isVendorOwner(user, vendorProduct.vendorId))
    ) {
      delete filtered.purchasePrice;
    }

    return filtered;
  }
}
