// src/common/guards/domain-restriction.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OriginDomain } from '@common/enums';
import { GatewayException } from '@common/exceptions';
import { ERROR_CODES } from '@common/constants';

// Operations restricted to specific domains
const DOMAIN_RESTRICTIONS: Record<string, OriginDomain[]> = {
  // Vendor-only operations
  GetVendorDashboard: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  GetVendorAnalytics: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  GetVendorProducts: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  CreateProduct: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  UpdateProduct: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  DeleteProduct: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  GetVendorOrders: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  UpdateOrderStatus: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  GetVendorPayouts: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  ManageVendorTeam: [OriginDomain.VENDOR, OriginDomain.ADMIN],
  UpdateVendorSettings: [OriginDomain.VENDOR, OriginDomain.ADMIN],

  // Admin-only operations
  GetAllUsers: [OriginDomain.ADMIN],
  GetAllVendors: [OriginDomain.ADMIN],
  ApproveVendor: [OriginDomain.ADMIN],
  RejectVendor: [OriginDomain.ADMIN],
  SuspendVendor: [OriginDomain.ADMIN],
  SuspendUser: [OriginDomain.ADMIN],
  GetPlatformAnalytics: [OriginDomain.ADMIN],
  GetPlatformRevenue: [OriginDomain.ADMIN],
  ManageCategories: [OriginDomain.ADMIN],
  ManagePlatformSettings: [OriginDomain.ADMIN],
  GetAuditLogs: [OriginDomain.ADMIN],
  ManageRoles: [OriginDomain.ADMIN],
  ManagePermissions: [OriginDomain.ADMIN],
};

@Injectable()
export class DomainRestrictionGuard implements CanActivate {
  private readonly logger = new Logger(DomainRestrictionGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const info = ctx.getInfo();

    const operationName = info?.operation?.name?.value;
    const originDomain = req.context?.originDomain;
    const requestId = req.context?.requestId;

    if (!operationName) {
      return true;
    }

    const allowedDomains = DOMAIN_RESTRICTIONS[operationName];

    // If no restrictions defined, allow from any domain
    if (!allowedDomains) {
      return true;
    }

    // Check if origin domain is allowed
    if (!allowedDomains.includes(originDomain)) {
      this.logger.warn(
        `[${requestId}] Domain restriction: ${operationName} not allowed from ${originDomain}`,
      );

      throw new GatewayException(
        {
          code: ERROR_CODES.DOMAIN_RESTRICTED,
          message: `Operation '${operationName}' is not available from this domain`,
          details: { operation: operationName, domain: originDomain },
        },
        403,
      );
    }

    return true;
  }
}
