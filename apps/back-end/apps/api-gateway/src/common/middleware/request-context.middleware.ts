// src/common/middleware/request-context.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { HEADERS } from '@common/constants';
import { OriginDomain } from '@common/enums';
import { AuthUser, GatewayContext } from '@common/interfaces';
import { DomainDetector } from '@common/utils';

declare global {
  namespace Express {
    interface Request {
      context: GatewayContext;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);
  private readonly jwtSecret: string;
  private readonly domainDetector: DomainDetector;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('auth.jwt.secret');
    this.domainDetector = new DomainDetector(
      this.configService.get<string[]>('cors.customerOrigins', []),
      this.configService.get<string[]>('cors.vendorOrigins', []),
      this.configService.get<string[]>('cors.adminOrigins', []),
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers[HEADERS.REQUEST_ID] as string;
    const correlationId = req.headers[HEADERS.CORRELATION_ID] as string;
    const startTime = Date.now();

    // Detect origin domain
    const originDomain = this.domainDetector.detect(req);

    // Extract and decode user from token
    const user = this.extractUser(req);

    // Get client IP
    const clientIp = this.getClientIp(req);

    // Build context
    const context: GatewayContext = {
      req,
      res,
      requestId,
      correlationId,
      startTime,
      originDomain,
      user,
      isAuthenticated: !!user,
      clientIp,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // Attach to request
    req.context = context;

    // Log request start
    this.logger.debug(
      `[${requestId}] ${req.method} ${req.path} from ${originDomain} (${clientIp})`,
    );

    next();
  }

  private extractUser(req: Request): AuthUser | null {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.configService.get<string>('auth.jwt.issuer'),
        audience: this.configService.get<string>('auth.jwt.audience'),
      }) as any;

      return {
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
    } catch (error) {
      // Token invalid or expired
      this.logger.debug(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers[HEADERS.FORWARDED_FOR] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = req.headers[HEADERS.REAL_IP] as string;
    if (realIp) {
      return realIp;
    }

    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
