// src/modules/users/entities/user-address.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from './user.entity';

export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
  BOTH = 'both',
}

@ObjectType()
@Entity('user_addresses')
export class UserAddress extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Field()
  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.BOTH,
  })
  type: AddressType;

  @Field()
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Field()
  @Column()
  label: string;

  @Field()
  @Column({ name: 'full_name' })
  fullName: string;

  @Field()
  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Field()
  @Column({ name: 'address_line1' })
  addressLine1: string;

  @Field({ nullable: true })
  @Column({ name: 'address_line2', nullable: true })
  addressLine2?: string;

  @Field()
  @Column()
  city: string;

  @Field()
  @Column()
  state: string;

  @Field()
  @Column({ name: 'postal_code' })
  postalCode: string;

  @Field()
  @Column({ name: 'country_code' })
  countryCode: string;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
