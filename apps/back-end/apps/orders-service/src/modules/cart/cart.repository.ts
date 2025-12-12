// src/modules/cart/cart.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async findActiveByCustomerId(customerId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: {
        customerId,
        status: CartStatus.ACTIVE,
      },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async createCart(customerId: string, currency = 'USD'): Promise<Cart> {
    const cart = this.cartRepository.create({
      customerId,
      currency,
      status: CartStatus.ACTIVE,
      items: [],
    });
    return this.cartRepository.save(cart);
  }

  async findCartItem(
    cartId: string,
    vendorProductId: string,
    vendorVariantId?: string,
  ): Promise<CartItem | null> {
    const where: any = { cartId, vendorProductId };
    if (vendorVariantId) {
      where.vendorVariantId = vendorVariantId;
    } else {
      where.vendorVariantId = null;
    }
    return this.cartItemRepository.findOne({ where });
  }

  async findCartItemById(itemId: string): Promise<CartItem | null> {
    return this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart'],
    });
  }

  async addItem(item: Partial<CartItem>): Promise<CartItem> {
    const cartItem = this.cartItemRepository.create(item);
    return this.cartItemRepository.save(cartItem);
  }

  async updateItem(id: string, updates: Partial<CartItem>): Promise<void> {
    await this.cartItemRepository.update(id, updates);
  }

  async removeItem(id: string): Promise<void> {
    await this.cartItemRepository.delete(id);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.cartItemRepository.delete({ cartId });
  }

  async updateCartStatus(cartId: string, status: CartStatus): Promise<void> {
    await this.cartRepository.update(cartId, { status });
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.cartRepository.softDelete(cartId);
  }
}
