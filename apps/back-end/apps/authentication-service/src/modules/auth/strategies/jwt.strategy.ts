// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@modules/users/users.service';
import { TokenService } from '../token.service';
import { JwtPayload } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
      issuer: configService.get('jwt.issuer'),
      audience: configService.get('jwt.audience'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<User> {
    // Check if session is revoked
    const isRevoked = await this.tokenService.isSessionRevoked(
      payload.sessionId,
    );
    if (isRevoked) {
      throw new UnauthorizedException('Session has been revoked');
    }

    // Get user
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach session ID to request for logout
    req.sessionId = payload.sessionId;

    return user;
  }
}
