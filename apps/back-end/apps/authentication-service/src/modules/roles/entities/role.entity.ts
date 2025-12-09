// src/modules/roles/entities/role.entity.ts
import { Entity, Column, Index, ManyToMany, JoinTable } from 'typeorm';
import { Field, ObjectType, Directive } from '@nestjs/graphql';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Permission } from './permission.entity';

export enum RoleType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('roles')
export class Role extends BaseEntity {
  @Field()
  @Column({ unique: true })
  @Index()
  name: string;

  @Field()
  @Column({ name: 'display_name' })
  displayName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.CUSTOM,
  })
  type: RoleType;

  @Field()
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Field(() => [Permission])
  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
