import { Module } from '@nestjs/common';
import { AuthenticationServiceController } from './authentication-service.controller';
import { AuthenticationServiceService } from './authentication-service.service';
import { AppModule } from './app.module';
import { MailModule } from '../mail/mail.module';
import { CaslModule } from '../casl/casl.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    AppModule,
    MailModule,
    CaslModule,
    SessionsModule,
    RolesModule,
    UsersModule,
    AuthModule,
    DatabaseModule,
  ],
  controllers: [AuthenticationServiceController],
  providers: [AuthenticationServiceService],
})
export class AuthenticationServiceModule {}
