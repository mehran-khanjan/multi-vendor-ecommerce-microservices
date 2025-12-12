// src/grpc/interfaces/product.interface.ts
import { Observable } from 'rxjs';

export interface VariantOption {
  name: string;
  value: string;
}

export interface Variant {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  options: VariantOption[];
}

export interface VendorVariantInfo {
  id: string;
  variantId: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface VendorProductInfo {
  id: string;
  vendorId: string;
  productId: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity: number;
  isPublished: boolean;
  status: string;
  handlingTime?: string;
  vendorVariants: VendorVariantInfo[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  categoryId?: string;
  categoryName?: string;
  isPublished: boolean;
  status: string;
  variants: Variant[];
  vendorProducts: VendorProductInfo[];
}

export interface GetProductBySlugRequest {
  slug: string;
}

export interface GetProductByIdRequest {
  productId: string;
}

export interface ProductResponse {
  success: boolean;
  product?: Product;
  error?: string;
}

export interface GetVariantByIdRequest {
  variantId: string;
}

export interface VariantResponse {
  success: boolean;
  variant?: Variant;
  error?: string;
}

export interface GetVendorProductRequest {
  vendorProductId: string;
}

export interface VendorProductResponse {
  success: boolean;
  vendorProduct?: VendorProductInfo;
  error?: string;
}

export interface StockCheckItem {
  vendorProductId: string;
  vendorVariantId?: string;
  quantity: number;
}

export interface CheckStockRequest {
  items: StockCheckItem[];
}

export interface StockCheckResult {
  vendorProductId: string;
  vendorVariantId?: string;
  requestedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
}

export interface CheckStockResponse {
  success: boolean;
  allAvailable: boolean;
  results: StockCheckResult[];
  error?: string;
}

export interface ReserveStockRequest {
  reservationId: string;
  items: StockCheckItem[];
  ttlSeconds: number;
}

export interface ReserveStockResponse {
  success: boolean;
  reservationId: string;
  expiresAt?: string;
  error?: string;
}

export interface ReleaseStockRequest {
  reservationId: string;
}

export interface ReleaseStockResponse {
  success: boolean;
  error?: string;
}

export interface ConfirmStockDeductionRequest {
  reservationId: string;
}

export interface ConfirmStockDeductionResponse {
  success: boolean;
  error?: string;
}

export interface IProductGrpcService {
  getProductBySlug(
    request: GetProductBySlugRequest,
  ): Observable<ProductResponse>;
  getProductById(request: GetProductByIdRequest): Observable<ProductResponse>;
  getVariantById(request: GetVariantByIdRequest): Observable<VariantResponse>;
  getVendorProduct(
    request: GetVendorProductRequest,
  ): Observable<VendorProductResponse>;
  checkStock(request: CheckStockRequest): Observable<CheckStockResponse>;
  reserveStock(request: ReserveStockRequest): Observable<ReserveStockResponse>;
  releaseStock(request: ReleaseStockRequest): Observable<ReleaseStockResponse>;
  confirmStockDeduction(
    request: ConfirmStockDeductionRequest,
  ): Observable<ConfirmStockDeductionResponse>;
}
