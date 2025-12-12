// products-service/src/modules/products/products.grpc.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { VendorProduct } from '@modules/vendor-products/entities/vendor-product.entity';
import { VendorVariant } from '@modules/vendor-products/entities/vendor-variant.entity';

interface StockCheckItem {
  vendorProductId: string;
  vendorVariantId?: string;
  quantity: number;
}

interface ReserveStockRequest {
  reservationId: string;
  items: StockCheckItem[];
  ttlSeconds: number;
}

@Controller()
export class ProductsGrpcController {
  private readonly logger = new Logger(ProductsGrpcController.name);

  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(VendorProduct)
    private readonly vendorProductRepository: Repository<VendorProduct>,
    @InjectRepository(VendorVariant)
    private readonly vendorVariantRepository: Repository<VendorVariant>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @GrpcMethod('ProductService', 'GetProductBySlug')
  async getProductBySlug(request: { slug: string }) {
    try {
      const product = await this.productsService.findPublishedProductBySlug(
        request.slug,
      );
      return {
        success: true,
        product: this.mapProductToProto(product),
      };
    } catch (error) {
      this.logger.error(`GetProductBySlug error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('ProductService', 'GetProductById')
  async getProductById(request: { productId: string }) {
    try {
      const product = await this.productsService.findById(request.productId);
      return {
        success: true,
        product: this.mapProductToProto(product),
      };
    } catch (error) {
      this.logger.error(`GetProductById error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('ProductService', 'GetVendorProduct')
  async getVendorProduct(request: { vendorProductId: string }) {
    try {
      const vendorProduct = await this.vendorProductRepository.findOne({
        where: { id: request.vendorProductId },
        relations: ['vendorVariants', 'product'],
      });

      if (!vendorProduct) {
        return { success: false, error: 'Vendor product not found' };
      }

      return {
        success: true,
        vendorProduct: this.mapVendorProductToProto(vendorProduct),
      };
    } catch (error) {
      this.logger.error(`GetVendorProduct error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('ProductService', 'CheckStock')
  async checkStock(request: { items: StockCheckItem[] }) {
    try {
      const results = [];
      let allAvailable = true;

      for (const item of request.items) {
        let availableQuantity = 0;

        if (item.vendorVariantId) {
          const variant = await this.vendorVariantRepository.findOne({
            where: { id: item.vendorVariantId },
          });
          availableQuantity = variant?.stockQuantity || 0;
        } else {
          const vendorProduct = await this.vendorProductRepository.findOne({
            where: { id: item.vendorProductId },
          });
          availableQuantity = vendorProduct?.stockQuantity || 0;
        }

        const isAvailable = availableQuantity >= item.quantity;
        if (!isAvailable) {
          allAvailable = false;
        }

        results.push({
          vendorProductId: item.vendorProductId,
          vendorVariantId: item.vendorVariantId,
          requestedQuantity: item.quantity,
          availableQuantity,
          isAvailable,
        });
      }

      return {
        success: true,
        allAvailable,
        results,
      };
    } catch (error) {
      this.logger.error(`CheckStock error: ${error.message}`);
      return {
        success: false,
        allAvailable: false,
        results: [],
        error: error.message,
      };
    }
  }

  @GrpcMethod('ProductService', 'ReserveStock')
  async reserveStock(request: ReserveStockRequest) {
    try {
      // Store reservation in Redis with TTL
      const reservationKey = `stock_reservation:${request.reservationId}`;
      const expiresAt = new Date(Date.now() + request.ttlSeconds * 1000);

      await this.cacheManager.set(
        reservationKey,
        JSON.stringify({
          items: request.items,
          expiresAt: expiresAt.toISOString(),
        }),
        request.ttlSeconds * 1000,
      );

      // Temporarily decrease available stock (soft reservation)
      for (const item of request.items) {
        if (item.vendorVariantId) {
          await this.vendorVariantRepository.decrement(
            { id: item.vendorVariantId },
            'stockQuantity',
            item.quantity,
          );
        } else {
          await this.vendorProductRepository.decrement(
            { id: item.vendorProductId },
            'stockQuantity',
            item.quantity,
          );
        }
      }

      this.logger.log(`Stock reserved: ${request.reservationId}`);

      return {
        success: true,
        reservationId: request.reservationId,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`ReserveStock error: ${error.message}`);
      return { success: false, reservationId: '', error: error.message };
    }
  }

  @GrpcMethod('ProductService', 'ReleaseStock')
  async releaseStock(request: { reservationId: string }) {
    try {
      const reservationKey = `stock_reservation:${request.reservationId}`;
      const reservationData =
        await this.cacheManager.get<string>(reservationKey);

      if (!reservationData) {
        return { success: true }; // Already released or expired
      }

      const reservation = JSON.parse(reservationData);

      // Restore stock
      for (const item of reservation.items) {
        if (item.vendorVariantId) {
          await this.vendorVariantRepository.increment(
            { id: item.vendorVariantId },
            'stockQuantity',
            item.quantity,
          );
        } else {
          await this.vendorProductRepository.increment(
            { id: item.vendorProductId },
            'stockQuantity',
            item.quantity,
          );
        }
      }

      await this.cacheManager.del(reservationKey);

      this.logger.log(`Stock released: ${request.reservationId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`ReleaseStock error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @GrpcMethod('ProductService', 'ConfirmStockDeduction')
  async confirmStockDeduction(request: { reservationId: string }) {
    try {
      const reservationKey = `stock_reservation:${request.reservationId}`;

      // Simply remove the reservation - stock was already deducted during reserve
      await this.cacheManager.del(reservationKey);

      this.logger.log(`Stock deduction confirmed: ${request.reservationId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`ConfirmStockDeduction error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private mapProductToProto(product: Product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: parseFloat(product.basePrice?.toString() || '0'),
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      isPublished: product.isPublished,
      status: product.status,
      variants:
        product.variants?.map((v) => ({
          id: v.id,
          productId: v.productId,
          name: v.name,
          basePrice: parseFloat(v.basePrice?.toString() || '0'),
          isActive: v.isActive,
          options:
            v.options?.map((o) => ({
              name: o.name,
              value: o.value,
            })) || [],
        })) || [],
      vendorProducts:
        product.vendorProducts?.map((vp) => this.mapVendorProductToProto(vp)) ||
        [],
    };
  }

  private mapVendorProductToProto(vp: VendorProduct) {
    return {
      id: vp.id,
      vendorId: vp.vendorId,
      productId: vp.productId,
      price: parseFloat(vp.price?.toString() || '0'),
      compareAtPrice: vp.compareAtPrice
        ? parseFloat(vp.compareAtPrice.toString())
        : null,
      currency: vp.currency,
      stockQuantity: vp.stockQuantity,
      isPublished: vp.isPublished,
      status: vp.status,
      handlingTime: vp.handlingTime,
      vendorVariants:
        vp.vendorVariants?.map((vv) => ({
          id: vv.id,
          variantId: vv.variantId,
          price: parseFloat(vv.price?.toString() || '0'),
          stockQuantity: vv.stockQuantity,
          isActive: vv.isActive,
        })) || [],
    };
  }
}
