// src/modules/payments/entities/payment-card.entity.ts
import { Entity, Column, Index } from 'typeorm';
import { Field, ObjectType, Directive } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  OTHER = 'other',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('payment_cards')
export class PaymentCard extends BaseEntity {
  @Field()
  @Column({ name: 'customer_id' })
  @Index()
  customerId: string;

  @Field()
  @Column({ name: 'card_holder_name' })
  cardHolderName: string;

  @Field()
  @Column({ name: 'last_four_digits', length: 4 })
  lastFourDigits: string;

  @Field()
  @Column({
    type: 'enum',
    enum: CardBrand,
    default: CardBrand.OTHER,
  })
  brand: CardBrand;

  @Field()
  @Column({ name: 'expiry_month', length: 2 })
  expiryMonth: string;

  @Field()
  @Column({ name: 'expiry_year', length: 4 })
  expiryYear: string;

  // src/modules/payments/entities/payment-card.entity.ts (continued)
  @Field()
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  nickname?: string;

  // Encrypted card token (for payment processor)
  @Column({ name: 'encrypted_token', type: 'text' })
  encryptedToken: string;

  // Billing address
  @Field({ nullable: true })
  @Column({ name: 'billing_address_line1', nullable: true })
  billingAddressLine1?: string;

  @Field({ nullable: true })
  @Column({ name: 'billing_address_line2', nullable: true })
  billingAddressLine2?: string;

  @Field({ nullable: true })
  @Column({ name: 'billing_city', nullable: true })
  billingCity?: string;

  @Field({ nullable: true })
  @Column({ name: 'billing_state', nullable: true })
  billingState?: string;

  @Field({ nullable: true })
  @Column({ name: 'billing_postal_code', nullable: true })
  billingPostalCode?: string;

  @Field({ nullable: true })
  @Column({ name: 'billing_country', nullable: true })
  billingCountry?: string;

  @Field()
  get isExpired(): boolean {
    const now = new Date();
    const expiryDate = new Date(
      parseInt(this.expiryYear),
      parseInt(this.expiryMonth),
      0,
    );
    return now > expiryDate;
  }

  @Field()
  get maskedNumber(): string {
    return `**** **** **** ${this.lastFourDigits}`;
  }
}
