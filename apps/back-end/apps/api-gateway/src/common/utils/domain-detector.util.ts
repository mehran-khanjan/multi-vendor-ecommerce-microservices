// src/common/utils/domain-detector.util.ts
import { Request } from 'express';
import { OriginDomain } from '@common/enums';

export class DomainDetector {
  private readonly customerPatterns: RegExp[];
  private readonly vendorPatterns: RegExp[];
  private readonly adminPatterns: RegExp[];

  constructor(
    customerOrigins: string[],
    vendorOrigins: string[],
    adminOrigins: string[],
  ) {
    this.customerPatterns = this.buildPatterns(customerOrigins);
    this.vendorPatterns = this.buildPatterns(vendorOrigins);
    this.adminPatterns = this.buildPatterns(adminOrigins);
  }

  private buildPatterns(origins: string[]): RegExp[] {
    return origins.map((origin) => {
      try {
        const url = new URL(origin);
        const pattern = url.host
          .replace(/\./g, '\\.')
          .replace(/:\d+/, '(:\\d+)?');
        return new RegExp(`^${pattern}$`, 'i');
      } catch {
        return new RegExp(`^${origin.replace(/\./g, '\\.')}$`, 'i');
      }
    });
  }

  detect(req: Request): OriginDomain {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const host = req.headers.host || '';

    // Extract hostname from origin or referer
    let hostname: string;

    try {
      if (origin) {
        hostname = new URL(origin).host;
      } else if (referer) {
        hostname = new URL(referer).host;
      } else {
        hostname = host;
      }
    } catch {
      hostname = host;
    }

    // Check against patterns
    if (this.adminPatterns.some((p) => p.test(hostname))) {
      return OriginDomain.ADMIN;
    }

    if (this.vendorPatterns.some((p) => p.test(hostname))) {
      return OriginDomain.VENDOR;
    }

    if (this.customerPatterns.some((p) => p.test(hostname))) {
      return OriginDomain.CUSTOMER;
    }

    return OriginDomain.UNKNOWN;
  }
}
