// src/modules/cart/cart.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartInput, UpdateCartItemInput } from './dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import { RequirePermissions, CurrentUser } from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class CartValidationIssue {
  @Field()
  itemId: string;

  @Field()
  type: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  currentPrice?: number;

  @Field({ nullable: true })
  availableQuantity?: number;
}

@ObjectType()
class CartValidationResult {
  @Field()
  valid: boolean;

  @Field(() => Cart)
  cart: Cart;

  @Field(() => [CartValidationIssue])
  issues: CartValidationIssue[];
}

@Resolver(() => Cart)
@UseGuards(AuthGuard, PermissionsGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @RequirePermissions({ action: Action.READ, subject: Subject.CART })
  @Query(() => Cart, { name: 'myCart', nullable: true })
  async getMyCart(@CurrentUser() user: UserContext): Promise<Cart | null> {
    return this.cartService.getCart(user);
  }

  @RequirePermissions({ action: Action.ADD_TO_CART, subject: Subject.CART })
  @Mutation(() => Cart)
  async addToCart(
    @Args('input') input: AddToCartInput,
    @CurrentUser() user: UserContext,
  ): Promise<Cart> {
    return this.cartService.addToCart(input, user);
  }

  @RequirePermissions({ action: Action.UPDATE, subject: Subject.CART_ITEM })
  @Mutation(() => Cart)
  async updateCartItem(
    @Args('itemId', { type: () => ID }) itemId: string,
    @Args('input') input: UpdateCartItemInput,
    @CurrentUser() user: UserContext,
  ): Promise<Cart> {
    return this.cartService.updateCartItem(itemId, input, user);
  }

  @RequirePermissions({
    action: Action.REMOVE_FROM_CART,
    subject: Subject.CART,
  })
  @Mutation(() => Cart)
  async removeFromCart(
    @Args('itemId', { type: () => ID }) itemId: string,
    @CurrentUser() user: UserContext,
  ): Promise<Cart> {
    return this.cartService.removeFromCart(itemId, user);
  }

  @RequirePermissions({ action: Action.CLEAR_CART, subject: Subject.CART })
  @Mutation(() => Boolean)
  async clearCart(@CurrentUser() user: UserContext): Promise<boolean> {
    return this.cartService.clearCart(user);
  }

  @RequirePermissions({ action: Action.READ, subject: Subject.CART })
  @Query(() => CartValidationResult, { name: 'validateCart' })
  async validateCart(
    @CurrentUser() user: UserContext,
  ): Promise<CartValidationResult> {
    return this.cartService.validateCartForCheckout(user);
  }
}
