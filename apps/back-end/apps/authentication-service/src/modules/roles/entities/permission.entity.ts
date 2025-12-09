// src/modules/roles/entities/permission.entity.ts
import { Entity, Column, Index, ManyToMany } from 'typeorm';
import { Field, ObjectType, Directive } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { Role } from './role.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('permissions')
export class Permission extends BaseEntity {
  @Field()
  @Column()
  @Index()
  resource: string;

  @Field()
  @Column()
  action: string;

  @Field()
  @Column({ default: 'any' })
  scope: string;

  @Field()
  @Column({ unique: true })
  @Index()
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
