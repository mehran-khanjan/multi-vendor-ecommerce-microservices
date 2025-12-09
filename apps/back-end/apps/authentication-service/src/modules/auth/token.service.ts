// src/modules/auth/token.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '@modules/users/entities/user.entity';
import { JwtPayload } from '@common/interfaces';
import { CryptoUtil, TokenUtil } from '@common/utils';
import { AuthException } from '@common/exceptions';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.accessExpiration = this.configService.get(
      'jwt.accessExpiration',
      '15m',
    );
    this.refreshExpiration = this.configService.get(
      'jwt.refreshExpiration',
      '7d',
    );
    this.jwtIssuer = this.configService.get('jwt.issuer', 'auth-service');
    this.jwtAudience = this.configService.get(
      'jwt.audience',
      'multi-vendor-app',
    );
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    user: User,
    sessionId: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // Generate access token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      roles: user.roleNames,
      permissions: user.permissions,
      tenantId: user.tenantId,
      vendorId: user.vendorId,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessExpiration,
      issuer: this.jwtIssuer,
      audience: this.jwtAudience,
    });

    // Generate refresh token
    const refreshTokenValue = CryptoUtil.generateToken(64);
    const refreshTokenHash = CryptoUtil.hashToken(refreshTokenValue);
    const expiresAt = TokenUtil.calculateExpiration(this.refreshExpiration);

    // Save refresh token to database
    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      sessionId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // Cache the session for quick lookup
    await this.cacheManager.set(
      `session:${sessionId}`,
      { userId: user.id, roles: user.roleNames },
      TokenUtil.parseExpiration(this.accessExpiration),
    );

    const expiresInMs = TokenUtil.parseExpiration(this.accessExpiration);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: Math.floor(expiresInMs / 1000),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshTokenValue: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
  }> {
    const tokenHash = CryptoUtil.hashToken(refreshTokenValue);

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    if (!refreshToken) {
      throw AuthException.tokenInvalid();
    }

    if (!refreshToken.isValid()) {
      // Token rotation: if token was already used, revoke all tokens for this user
      if (refreshToken.isRevoked) {
        await this.revokeAllUserTokens(refreshToken.userId);
        this.logger.warn(
          `Potential token theft detected for user ${refreshToken.userId}`,
        );
      }
      throw AuthException.refreshTokenExpired();
    }

    // Revoke current refresh token (rotation)
    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(
      refreshToken.user,
      refreshToken.sessionId,
      metadata,
    );

    // Update the old token with reference to new one
    refreshToken.replacedBy = CryptoUtil.hashToken(tokens.refreshToken);
    await this.refreshTokenRepository.save(refreshToken);

    return { ...tokens, user: refreshToken.user };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      });

      // Check if session is revoked
      const isRevoked = await this.isSessionRevoked(payload.sessionId);
      if (isRevoked) {
        throw AuthException.tokenInvalid();
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AuthException.tokenExpired();
      }
      throw AuthException.tokenInvalid();
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { tokenHash },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    // Also invalidate cached sessions
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
      select: ['sessionId'],
    });

    for (const token of tokens) {
      await this.cacheManager.del(`session:${token.sessionId}`);
    }

    this.logger.log(`All tokens revoked for user ${userId}`);
  }

  /**
   * Revoke tokens by session ID
   */
  async revokeSessionTokens(sessionId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { sessionId },
      { isRevoked: true, revokedAt: new Date() },
    );

    await this.cacheManager.del(`session:${sessionId}`);
  }

  /**
   * Check if session is revoked
   */
  async isSessionRevoked(sessionId: string): Promise<boolean> {
    // Check cache first
    const cachedSession = await this.cacheManager.get(`session:${sessionId}`);
    if (cachedSession) {
      return false;
    }

    // Check database
    const token = await this.refreshTokenRepository.findOne({
      where: { sessionId, isRevoked: false },
    });

    return !token || !token.isValid();
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired tokens`);
    return result.affected || 0;
  }

  /**
   * Get user's active refresh tokens
   */
  async getUserActiveTokens(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });
  }
}
