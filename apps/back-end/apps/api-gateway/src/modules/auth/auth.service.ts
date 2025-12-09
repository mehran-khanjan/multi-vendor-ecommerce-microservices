// src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AuthUser } from '@common/interfaces';
import { GatewayException } from '@common/exceptions';
import { ERROR_CODES } from '@common/constants';

interface TokenValidationResult {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string;
  private readonly authServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.jwtSecret = this.configService.get<string>('auth.jwt.secret');
    this.jwtIssuer = this.configService.get<string>('auth.jwt.issuer');
    this.jwtAudience = this.configService.get<string>('auth.jwt.audience');

    const subgraphs = this.configService.get('services.subgraphs', []);
    const authSubgraph = subgraphs.find((s: any) => s.name === 'auth');
    this.authServiceUrl = authSubgraph?.url?.replace('/graphql', '') || '';
  }

  /**
   * Validate JWT token locally
   */
  validateTokenLocally(token: string): TokenValidationResult {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }) as any;

      const user: AuthUser = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        emailVerified: decoded.email_verified || false,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        tenantId: decoded.tenant_id,
        vendorId: decoded.vendor_id,
        metadata: decoded.metadata,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      return { valid: true, user };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Validate token with auth service (for complete validation including revocation check)
   */
  async validateTokenRemotely(
    token: string,
    requestId: string,
  ): Promise<TokenValidationResult> {
    if (!this.authServiceUrl) {
      // Fallback to local validation if auth service URL not configured
      return this.validateTokenLocally(token);
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<{ valid: boolean; user?: AuthUser; error?: string }>(
            `${this.authServiceUrl}/auth/validate`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Request-ID': requestId,
              },
              timeout: 5000,
            },
          )
          .pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.warn(
                `[${requestId}] Auth service validation failed: ${error.message}`,
              );
              throw error;
            }),
          ),
      );

      return response.data;
    } catch (error) {
      // Fallback to local validation on service error
      this.logger.debug(
        `[${requestId}] Falling back to local token validation`,
      );
      return this.validateTokenLocally(token);
    }
  }

  /**
   * Check if user has required roles
   */
  hasRoles(user: AuthUser, requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }

  /**
   * Check if user has required permissions
   */
  hasPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );
  }

  /**
   * Check if user can access vendor resources
   */
  canAccessVendor(user: AuthUser, vendorId: string): boolean {
    // Admins can access any vendor
    if (user.roles.includes('admin') || user.roles.includes('super_admin')) {
      return true;
    }

    // Vendor users can only access their own vendor
    return user.vendorId === vendorId;
  }

  /**
   * Extract token from authorization header
   */
  extractToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }
}
