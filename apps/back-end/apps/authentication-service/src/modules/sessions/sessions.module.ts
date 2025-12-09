// src/modules/sessions/sessions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsResolver } from './sessions.resolver';
import { Session } from './entities/session.entity';
import { CaslModule } from '@modules/casl/casl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), CaslModule],
  providers: [SessionsService, SessionsResolver],
  exports: [SessionsService],
})
export class SessionsModule {}
