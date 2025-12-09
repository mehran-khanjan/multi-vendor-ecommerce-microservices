// src/modules/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';
import { Role, Permission } from './entities';
import { CaslModule } from '@modules/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission]), CaslModule],
  providers: [RolesService, RolesResolver],
  exports: [RolesService],
})
export class RolesModule {}
