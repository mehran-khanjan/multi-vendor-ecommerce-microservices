// src/common/middleware/auth-context.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HEADERS } from '@common/constants';
import { UserContext, RequestContext } from '@common/interfaces';

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers[HEADERS.REQUEST_ID] as string) || uuidv4();

    // Extract user context from headers (set by API Gateway)
    const user = this.extractUserFromHeaders(req);

    // Build request context
    const context: RequestContext = {
      requestId,
      user,
      isAuthenticated: !!user,
    };

    req.context = context;

    // Set response header
    res.setHeader(HEADERS.REQUEST_ID, requestId);

    this.logger.debug(
      `[${requestId}] ${req.method} ${req.path} | User: ${user?.id || 'anonymous'} | Roles: ${user?.roles?.join(', ') || 'none'}`,
    );

    next();
  }

  private extractUserFromHeaders(req: Request): UserContext | null {
    const userId = req.headers[HEADERS.USER_ID] as string;

    if (!userId) {
      return null;
    }

    // Parse roles and permissions from headers
    let roles: string[] = [];
    let permissions: string[] = [];

    try {
      const rolesHeader = req.headers[HEADERS.USER_ROLES] as string;
      if (rolesHeader) {
        roles = JSON.parse(rolesHeader);
      }
    } catch (e) {
      this.logger.warn('Failed to parse user roles from header');
    }

    try {
      const permissionsHeader = req.headers[HEADERS.USER_PERMISSIONS] as string;
      if (permissionsHeader) {
        permissions = JSON.parse(permissionsHeader);
      }
    } catch (e) {
      this.logger.warn('Failed to parse user permissions from header');
    }

    return {
      id: userId,
      email: req.headers[HEADERS.USER_EMAIL] as string,
      roles,
      permissions,
      vendorId: req.headers[HEADERS.VENDOR_ID] as string,
      tenantId: req.headers[HEADERS.TENANT_ID] as string,
    };
  }
}
