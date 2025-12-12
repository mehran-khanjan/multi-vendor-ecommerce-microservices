// src/modules/payments/payments.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentCard, CardBrand } from './entities/payment-card.entity';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from './entities/payment.entity';
import { CreatePaymentCardInput, ProcessPaymentInput } from './dto';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { UserContext } from '@common/interfaces';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(PaymentCard)
    private readonly paymentCardRepository: Repository<PaymentCard>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly authService: AuthorizationService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'payment.encryptionKey',
    );
  }

  // ==========================================
  // Card Management
  // ==========================================

  /**
   * Get all payment cards for a customer
   */
  async getCustomerCards(user: UserContext): Promise<PaymentCard[]> {
    return this.paymentCardRepository.find({
      where: { customerId: user.id },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific payment card
   */
  async getCardById(id: string, user: UserContext): Promise<PaymentCard> {
    const card = await this.paymentCardRepository.findOne({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Payment card not found');
    }

    if (!this.authService.canAccessUserData(user, card.customerId)) {
      throw new ForbiddenException('Access denied');
    }

    return card;
  }

  /**
   * Add a new payment card
   */
  async addPaymentCard(
    input: CreatePaymentCardInput,
    user: UserContext,
  ): Promise<PaymentCard> {
    // Validate card number (basic Luhn check)
    if (!this.validateCardNumber(input.cardNumber)) {
      throw new BadRequestException('Invalid card number');
    }

    // Validate expiry date
    if (!this.validateExpiryDate(input.expiryMonth, input.expiryYear)) {
      throw new BadRequestException('Card has expired');
    }

    // Detect card brand
    const brand = this.detectCardBrand(input.cardNumber);

    // Extract last 4 digits
    const lastFourDigits = input.cardNumber.slice(-4);

    // Encrypt card data (in production, use proper tokenization service)
    const encryptedToken = this.encryptCardData({
      cardNumber: input.cardNumber,
      cvv: input.cvv,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
    });

    // If this is default, unset other default cards
    if (input.isDefault) {
      await this.paymentCardRepository.update(
        { customerId: user.id, isDefault: true },
        { isDefault: false },
      );
    }

    // Check if customer has no cards, make this default
    const existingCards = await this.paymentCardRepository.count({
      where: { customerId: user.id },
    });

    const card = this.paymentCardRepository.create({
      customerId: user.id,
      cardHolderName: input.cardHolderName,
      lastFourDigits,
      brand,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      encryptedToken,
      isDefault: input.isDefault || existingCards === 0,
      nickname: input.nickname,
      billingAddressLine1: input.billingAddressLine1,
      billingAddressLine2: input.billingAddressLine2,
      billingCity: input.billingCity,
      billingState: input.billingState,
      billingPostalCode: input.billingPostalCode,
      billingCountry: input.billingCountry,
    });

    const saved = await this.paymentCardRepository.save(card);

    this.logger.log(`Payment card added for customer ${user.id}: ${saved.id}`);

    return saved;
  }

  /**
   * Remove a payment card
   */
  async removePaymentCard(id: string, user: UserContext): Promise<boolean> {
    const card = await this.getCardById(id, user);

    // Check if card is used in any pending orders
    const pendingPayments = await this.paymentRepository.count({
      where: {
        paymentCardId: id,
        status: PaymentStatus.PENDING,
      },
    });

    if (pendingPayments > 0) {
      throw new BadRequestException('Cannot delete card with pending payments');
    }

    await this.paymentCardRepository.softDelete(id);

    // If this was the default card, set another as default
    if (card.isDefault) {
      const anotherCard = await this.paymentCardRepository.findOne({
        where: { customerId: user.id },
        order: { createdAt: 'DESC' },
      });

      if (anotherCard) {
        await this.paymentCardRepository.update(anotherCard.id, {
          isDefault: true,
        });
      }
    }

    this.logger.log(`Payment card removed for customer ${user.id}: ${id}`);

    return true;
  }

  /**
   * Set a card as default
   */
  async setDefaultCard(id: string, user: UserContext): Promise<PaymentCard> {
    const card = await this.getCardById(id, user);

    // Unset other default cards
    await this.paymentCardRepository.update(
      { customerId: user.id, isDefault: true },
      { isDefault: false },
    );

    // Set this card as default
    card.isDefault = true;
    await this.paymentCardRepository.save(card);

    this.logger.log(`Default card set for customer ${user.id}: ${id}`);

    return card;
  }

  // ==========================================
  // Payment Processing
  // ==========================================

  /**
   * Process a payment
   */
  async processPayment(
    input: ProcessPaymentInput,
    user: UserContext,
  ): Promise<Payment> {
    let paymentCard: PaymentCard | null = null;

    if (input.paymentCardId) {
      paymentCard = await this.getCardById(input.paymentCardId, user);

      if (paymentCard.isExpired) {
        throw new BadRequestException('Card has expired');
      }
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      orderId: input.orderId,
      customerId: user.id,
      paymentCardId: input.paymentCardId,
      amount: input.amount,
      currency: input.currency || 'USD',
      method: input.method || PaymentMethod.CARD,
      status: PaymentStatus.PROCESSING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    try {
      // Simulate payment processing
      // In production, integrate with payment gateway (Stripe, PayPal, etc.)
      const result = await this.simulatePaymentGateway({
        amount: input.amount,
        currency: input.currency || 'USD',
        cardToken: paymentCard?.encryptedToken,
      });

      if (result.success) {
        savedPayment.status = PaymentStatus.COMPLETED;
        savedPayment.transactionId = result.transactionId;
        savedPayment.gatewayResponse = result.response;
        savedPayment.processedAt = new Date();

        this.logger.log(
          `Payment completed for order ${input.orderId}: ${savedPayment.id}`,
        );
      } else {
        savedPayment.status = PaymentStatus.FAILED;
        savedPayment.failureReason = result.error;
        savedPayment.gatewayResponse = result.response;

        this.logger.warn(
          `Payment failed for order ${input.orderId}: ${result.error}`,
        );
      }
    } catch (error) {
      savedPayment.status = PaymentStatus.FAILED;
      savedPayment.failureReason = error.message;

      this.logger.error(
        `Payment error for order ${input.orderId}: ${error.message}`,
      );
    }

    return this.paymentRepository.save(savedPayment);
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get payments for a customer
   */
  async getCustomerPayments(user: UserContext): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { customerId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentId: string,
    amount: number,
    reason: string,
    user: UserContext,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only admin or the customer can initiate refund
    if (!this.authService.isAdmin(user) && payment.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const totalRefunded = (payment.refundedAmount || 0) + amount;
    if (totalRefunded > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    // Simulate refund processing
    const refundResult = await this.simulateRefund({
      transactionId: payment.transactionId,
      amount,
    });

    if (refundResult.success) {
      payment.refundedAmount = totalRefunded;
      payment.refundReason = reason;
      payment.status =
        totalRefunded >= payment.amount
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      this.logger.log(`Refund processed for payment ${paymentId}: $${amount}`);
    } else {
      throw new BadRequestException(`Refund failed: ${refundResult.error}`);
    }

    return this.paymentRepository.save(payment);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private validateCardNumber(cardNumber: string): boolean {
    // Luhn algorithm
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private validateExpiryDate(month: string, year: string): boolean {
    const now = new Date();
    const expiry = new Date(parseInt(year), parseInt(month), 0);
    return expiry > now;
  }

  private detectCardBrand(cardNumber: string): CardBrand {
    const patterns = {
      [CardBrand.VISA]: /^4/,
      [CardBrand.MASTERCARD]: /^5[1-5]/,
      [CardBrand.AMEX]: /^3[47]/,
      [CardBrand.DISCOVER]: /^6(?:011|5)/,
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return brand as CardBrand;
      }
    }

    return CardBrand.OTHER;
  }

  private encryptCardData(data: Record<string, string>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
      iv,
    );

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private async simulatePaymentGateway(params: {
    amount: number;
    currency: string;
    cardToken?: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
    response?: Record<string, any>;
  }> {
    // Simulate payment gateway delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        response: {
          status: 'approved',
          amount: params.amount,
          currency: params.currency,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      error: 'Payment declined by issuer',
      response: {
        status: 'declined',
        code: 'card_declined',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async simulateRefund(params: {
    transactionId: string;
    amount: number;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate 98% success rate for refunds
    return {
      success: Math.random() > 0.02,
      error: Math.random() > 0.02 ? undefined : 'Refund processing error',
    };
  }
}
