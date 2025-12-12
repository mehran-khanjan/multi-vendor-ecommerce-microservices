// src/modules/payments/payments.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentCard } from './entities/payment-card.entity';
import { Payment } from './entities/payment.entity';
import { CreatePaymentCardInput } from './dto';
import { AuthGuard, PermissionsGuard } from '@common/guards';
import { RequirePermissions, CurrentUser } from '@common/decorators';
import { Action, Subject } from '@common/enums';
import { UserContext } from '@common/interfaces';

@Resolver()
@UseGuards(AuthGuard, PermissionsGuard)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==========================================
  // Payment Card Queries & Mutations
  // ==========================================

  @RequirePermissions({
    action: Action.VIEW_PAYMENT_CARDS,
    subject: Subject.PAYMENT_CARD,
  })
  @Query(() => [PaymentCard], { name: 'myPaymentCards' })
  async getMyPaymentCards(
    @CurrentUser() user: UserContext,
  ): Promise<PaymentCard[]> {
    return this.paymentsService.getCustomerCards(user);
  }

  @RequirePermissions({
    action: Action.VIEW_PAYMENT_CARDS,
    subject: Subject.PAYMENT_CARD,
  })
  @Query(() => PaymentCard, { name: 'paymentCard' })
  async getPaymentCard(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<PaymentCard> {
    return this.paymentsService.getCardById(id, user);
  }

  @RequirePermissions({
    action: Action.ADD_PAYMENT_CARD,
    subject: Subject.PAYMENT_CARD,
  })
  @Mutation(() => PaymentCard)
  async addPaymentCard(
    @Args('input') input: CreatePaymentCardInput,
    @CurrentUser() user: UserContext,
  ): Promise<PaymentCard> {
    return this.paymentsService.addPaymentCard(input, user);
  }

  @RequirePermissions({
    action: Action.REMOVE_PAYMENT_CARD,
    subject: Subject.PAYMENT_CARD,
  })
  @Mutation(() => Boolean)
  async removePaymentCard(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<boolean> {
    return this.paymentsService.removePaymentCard(id, user);
  }

  @RequirePermissions({ action: Action.UPDATE, subject: Subject.PAYMENT_CARD })
  @Mutation(() => PaymentCard)
  async setDefaultPaymentCard(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserContext,
  ): Promise<PaymentCard> {
    return this.paymentsService.setDefaultCard(id, user);
  }

  // ==========================================
  // Payment Queries
  // ==========================================

  @RequirePermissions({ action: Action.READ, subject: Subject.PAYMENT })
  @Query(() => [Payment], { name: 'myPayments' })
  async getMyPayments(@CurrentUser() user: UserContext): Promise<Payment[]> {
    return this.paymentsService.getCustomerPayments(user);
  }

  @RequirePermissions({
    action: Action.REFUND_PAYMENT,
    subject: Subject.PAYMENT,
  })
  @Mutation(() => Payment)
  async refundPayment(
    @Args('paymentId', { type: () => ID }) paymentId: string,
    @Args('amount') amount: number,
    @Args('reason') reason: string,
    @CurrentUser() user: UserContext,
  ): Promise<Payment> {
    return this.paymentsService.processRefund(paymentId, amount, reason, user);
  }
}
