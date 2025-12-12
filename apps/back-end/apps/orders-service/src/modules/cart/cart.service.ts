// src/modules/cart/cart.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartInput, UpdateCartItemInput } from './dto';
import { ProductGrpcClient } from '@grpc/clients';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { UserContext } from '@common/interfaces';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productGrpcClient: ProductGrpcClient,
    private readonly authService: AuthorizationService,
  ) {}

  /**
   * Get or create active cart for customer
   */
  async getOrCreateCart(user: UserContext): Promise<Cart> {
    let cart = await this.cartRepository.findActiveByCustomerId(user.id);

    if (!cart) {
      cart = await this.cartRepository.createCart(user.id);
      this.logger.log(`Created new cart for customer ${user.id}: ${cart.id}`);
    }

    return cart;
  }

  /**
   * Get customer's active cart
   */
  async getCart(user: UserContext): Promise<Cart | null> {
    return this.cartRepository.findActiveByCustomerId(user.id);
  }

  /**
   * Add item to cart
   */
  async addToCart(input: AddToCartInput, user: UserContext): Promise<Cart> {
    // Get product details from product service
    const productResponse = await this.productGrpcClient.getProductBySlug(
      input.productSlug,
    );

    if (!productResponse.success || !productResponse.product) {
      throw new NotFoundException(`Product not found: ${input.productSlug}`);
    }

    const product = productResponse.product;

    if (!product.isPublished || product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    // Find the vendor product
    const vendorProduct = product.vendorProducts?.find(
      (vp) => vp.id === input.vendorProductId,
    );

    if (!vendorProduct) {
      throw new NotFoundException('Vendor product not found');
    }

    if (!vendorProduct.isPublished || vendorProduct.status !== 'active') {
      throw new BadRequestException('This offer is not available');
    }

    // Get variant info if specified
    let variant = null;
    let vendorVariant = null;
    let unitPrice = vendorProduct.price;
    let variantName = null;

    if (input.variantId) {
      variant = product.variants?.find((v) => v.id === input.variantId);
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }
      variantName = variant.name;

      if (input.vendorVariantId) {
        vendorVariant = vendorProduct.vendorVariants?.find(
          (vv) => vv.id === input.vendorVariantId,
        );
        if (!vendorVariant) {
          throw new NotFoundException('Vendor variant not found');
        }
        unitPrice = vendorVariant.price;
      }
    }

    // Check stock availability
    const stockCheck = await this.productGrpcClient.checkStock([
      {
        vendorProductId: input.vendorProductId,
        vendorVariantId: input.vendorVariantId,
        quantity: input.quantity,
      },
    ]);

    if (!stockCheck.success || !stockCheck.allAvailable) {
      const result = stockCheck.results?.[0];
      throw new BadRequestException(
        `Insufficient stock. Available: ${result?.availableQuantity || 0}`,
      );
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(user);

    // Check if item already exists in cart
    const existingItem = await this.cartRepository.findCartItem(
      cart.id,
      input.vendorProductId,
      input.vendorVariantId,
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + input.quantity;

      // Re-check stock for new quantity
      const recheck = await this.productGrpcClient.checkStock([
        {
          vendorProductId: input.vendorProductId,
          vendorVariantId: input.vendorVariantId,
          quantity: newQuantity,
        },
      ]);

      if (!recheck.success || !recheck.allAvailable) {
        throw new BadRequestException(
          `Cannot add more items. Maximum available: ${recheck.results?.[0]?.availableQuantity || 0}`,
        );
      }

      await this.cartRepository.updateItem(existingItem.id, {
        quantity: newQuantity,
        unitPrice, // Update price in case it changed
      });

      this.logger.log(
        `Updated cart item ${existingItem.id}: quantity ${existingItem.quantity} -> ${newQuantity}`,
      );
    } else {
      // Add new item
      await this.cartRepository.addItem({
        cartId: cart.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: input.variantId,
        variantName,
        vendorId: vendorProduct.vendorId,
        vendorProductId: input.vendorProductId,
        vendorVariantId: input.vendorVariantId,
        quantity: input.quantity,
        unitPrice,
        originalPrice: vendorProduct.compareAtPrice,
      });

      this.logger.log(
        `Added item to cart ${cart.id}: ${product.name} x${input.quantity}`,
      );
    }

    // Return updated cart
    return this.cartRepository.findById(cart.id);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    itemId: string,
    input: UpdateCartItemInput,
    user: UserContext,
  ): Promise<Cart> {
    const cartItem = await this.cartRepository.findCartItemById(itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify ownership
    if (cartItem.cart.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (input.quantity === 0) {
      // Remove item
      await this.cartRepository.removeItem(itemId);
      this.logger.log(`Removed item ${itemId} from cart ${cartItem.cartId}`);
    } else {
      // Check stock for new quantity
      const stockCheck = await this.productGrpcClient.checkStock([
        {
          vendorProductId: cartItem.vendorProductId,
          vendorVariantId: cartItem.vendorVariantId,
          quantity: input.quantity,
        },
      ]);

      if (!stockCheck.success || !stockCheck.allAvailable) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${stockCheck.results?.[0]?.availableQuantity || 0}`,
        );
      }

      await this.cartRepository.updateItem(itemId, {
        quantity: input.quantity,
      });
      this.logger.log(
        `Updated item ${itemId} quantity: ${cartItem.quantity} -> ${input.quantity}`,
      );
    }

    return this.cartRepository.findById(cartItem.cartId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string, user: UserContext): Promise<Cart> {
    const cartItem = await this.cartRepository.findCartItemById(itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.cartRepository.removeItem(itemId);
    this.logger.log(`Removed item ${itemId} from cart ${cartItem.cartId}`);

    return this.cartRepository.findById(cartItem.cartId);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(user: UserContext): Promise<boolean> {
    const cart = await this.cartRepository.findActiveByCustomerId(user.id);

    if (!cart) {
      return true;
    }

    await this.cartRepository.clearCart(cart.id);
    this.logger.log(`Cleared cart ${cart.id}`);

    return true;
  }

  /**
   * Mark cart as converted (after order placed)
   */
  async markCartAsConverted(cartId: string): Promise<void> {
    await this.cartRepository.updateCartStatus(cartId, CartStatus.CONVERTED);
    this.logger.log(`Cart ${cartId} marked as converted`);
  }

  /**
   * Validate cart items before checkout
   * Returns validation results with current prices and stock
   */
  async validateCartForCheckout(user: UserContext): Promise<{
    valid: boolean;
    cart: Cart;
    issues: Array<{
      itemId: string;
      type: 'out_of_stock' | 'price_changed' | 'unavailable';
      message: string;
      currentPrice?: number;
      availableQuantity?: number;
    }>;
  }> {
    const cart = await this.cartRepository.findActiveByCustomerId(user.id);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const issues: Array<{
      itemId: string;
      type: 'out_of_stock' | 'price_changed' | 'unavailable';
      message: string;
      currentPrice?: number;
      availableQuantity?: number;
    }> = [];

    // Check stock for all items
    const stockItems = cart.items.map((item) => ({
      vendorProductId: item.vendorProductId,
      vendorVariantId: item.vendorVariantId,
      quantity: item.quantity,
    }));

    const stockCheck = await this.productGrpcClient.checkStock(stockItems);

    if (!stockCheck.success) {
      throw new BadRequestException('Failed to validate stock');
    }

    for (const result of stockCheck.results) {
      if (!result.isAvailable) {
        const item = cart.items.find(
          (i) =>
            i.vendorProductId === result.vendorProductId &&
            i.vendorVariantId === result.vendorVariantId,
        );

        if (item) {
          issues.push({
            itemId: item.id,
            type:
              result.availableQuantity === 0 ? 'out_of_stock' : 'out_of_stock',
            message:
              result.availableQuantity === 0
                ? 'Item is out of stock'
                : `Only ${result.availableQuantity} items available`,
            availableQuantity: result.availableQuantity,
          });
        }
      }
    }

    // Verify prices haven't changed
    for (const item of cart.items) {
      const vendorProductResponse =
        await this.productGrpcClient.getVendorProduct(item.vendorProductId);

      if (
        !vendorProductResponse.success ||
        !vendorProductResponse.vendorProduct
      ) {
        issues.push({
          itemId: item.id,
          type: 'unavailable',
          message: 'Product is no longer available',
        });
        continue;
      }

      const vp = vendorProductResponse.vendorProduct;

      if (!vp.isPublished || vp.status !== 'active') {
        issues.push({
          itemId: item.id,
          type: 'unavailable',
          message: 'Product offer is no longer available',
        });
        continue;
      }

      let currentPrice = vp.price;

      if (item.vendorVariantId) {
        const vendorVariant = vp.vendorVariants?.find(
          (vv) => vv.id === item.vendorVariantId,
        );

        if (!vendorVariant || !vendorVariant.isActive) {
          issues.push({
            itemId: item.id,
            type: 'unavailable',
            message: 'Variant is no longer available',
          });
          continue;
        }

        currentPrice = vendorVariant.price;
      }

      // Check if price changed significantly (more than 1 cent difference)
      if (Math.abs(currentPrice - item.unitPrice) > 0.01) {
        issues.push({
          itemId: item.id,
          type: 'price_changed',
          message: `Price changed from $${item.unitPrice} to $${currentPrice}`,
          currentPrice,
        });

        // Update the price in cart
        await this.cartRepository.updateItem(item.id, {
          unitPrice: currentPrice,
        });
      }
    }

    return {
      valid: issues.length === 0,
      cart: await this.cartRepository.findById(cart.id),
      issues,
    };
  }
}
