// src/modules/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UsersRepository } from './users.repository';
import { User, UserProfile, UserAddress } from './entities';
import { RolesModule } from '@modules/roles/roles.module';
import { CaslModule } from '@modules/casl/casl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserAddress]),
    forwardRef(() => RolesModule),
    CaslModule,
  ],
  providers: [UsersService, UsersResolver, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
