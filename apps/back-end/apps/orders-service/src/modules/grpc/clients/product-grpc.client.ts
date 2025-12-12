// src/grpc/clients/product-grpc.client.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import {
  IProductGrpcService,
  ProductResponse,
  VariantResponse,
  VendorProductResponse,
  CheckStockResponse,
  ReserveStockResponse,
  ReleaseStockResponse,
  ConfirmStockDeductionResponse,
  StockCheckItem,
} from '../interfaces';

@Injectable()
export class ProductGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ProductGrpcClient.name);
  private productService: IProductGrpcService;
  private client: ClientGrpc;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('grpc.productService.url');

    this.client = Client({
      transport: Transport.GRPC,
      options: {
        package: 'product',
        protoPath: join(__dirname, '../../proto/product.proto'),
        url,
      },
    }) as unknown as ClientGrpc;

    this.productService =
      this.client.getService<IProductGrpcService>('ProductService');
    this.logger.log(`Product gRPC client connected to ${url}`);
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    try {
      return await firstValueFrom(
        this.productService.getProductBySlug({ slug }),
      );
    } catch (error) {
      this.logger.error(`Failed to get product by slug: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getProductById(productId: string): Promise<ProductResponse> {
    try {
      return await firstValueFrom(
        this.productService.getProductById({ productId }),
      );
    } catch (error) {
      this.logger.error(`Failed to get product by ID: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getVariantById(variantId: string): Promise<VariantResponse> {
    try {
      return await firstValueFrom(
        this.productService.getVariantById({ variantId }),
      );
    } catch (error) {
      this.logger.error(`Failed to get variant: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getVendorProduct(
    vendorProductId: string,
  ): Promise<VendorProductResponse> {
    try {
      return await firstValueFrom(
        this.productService.getVendorProduct({ vendorProductId }),
      );
    } catch (error) {
      this.logger.error(`Failed to get vendor product: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async checkStock(items: StockCheckItem[]): Promise<CheckStockResponse> {
    try {
      return await firstValueFrom(this.productService.checkStock({ items }));
    } catch (error) {
      this.logger.error(`Failed to check stock: ${error.message}`);
      return {
        success: false,
        allAvailable: false,
        results: [],
        error: error.message,
      };
    }
  }

  async reserveStock(
    reservationId: string,
    items: StockCheckItem[],
    ttlSeconds: number,
  ): Promise<ReserveStockResponse> {
    try {
      return await firstValueFrom(
        this.productService.reserveStock({
          reservationId,
          items,
          ttlSeconds,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to reserve stock: ${error.message}`);
      return { success: false, reservationId: '', error: error.message };
    }
  }

  async releaseStock(reservationId: string): Promise<ReleaseStockResponse> {
    try {
      return await firstValueFrom(
        this.productService.releaseStock({ reservationId }),
      );
    } catch (error) {
      this.logger.error(`Failed to release stock: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async confirmStockDeduction(
    reservationId: string,
  ): Promise<ConfirmStockDeductionResponse> {
    try {
      return await firstValueFrom(
        this.productService.confirmStockDeduction({ reservationId }),
      );
    } catch (error) {
      this.logger.error(`Failed to confirm stock deduction: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
