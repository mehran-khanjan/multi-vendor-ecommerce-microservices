// src/modules/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { TwoFactorService } from './two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { RefreshToken, PasswordReset, EmailVerification } from './entities';
import { UsersModule } from '@modules/users/users.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { MailModule } from '@modules/mail/mail.module';
import { CaslModule } from '@modules/casl/casl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, PasswordReset, EmailVerification]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiration', '15m'),
          issuer: configService.get('jwt.issuer', 'auth-service'),
          audience: configService.get('jwt.audience', 'multi-vendor-app'),
        },
      }),
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => SessionsModule),
    MailModule,
    CaslModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    TokenService,
    PasswordService,
    TwoFactorService,
    JwtStrategy,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
