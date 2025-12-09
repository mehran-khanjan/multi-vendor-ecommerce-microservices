// src/common/constants/headers.constant.ts
export const HEADERS = {
  // Request identification
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',

  // User context
  USER_ID: 'x-user-id',
  USER_EMAIL: 'x-user-email',
  USER_ROLES: 'x-user-roles',
  USER_PERMISSIONS: 'x-user-permissions',
  TENANT_ID: 'x-tenant-id',
  VENDOR_ID: 'x-vendor-id',

  // Origin context
  ORIGIN_DOMAIN: 'x-origin-domain',
  FORWARDED_FOR: 'x-forwarded-for',
  FORWARDED_HOST: 'x-forwarded-host',
  FORWARDED_PROTO: 'x-forwarded-proto',
  REAL_IP: 'x-real-ip',

  // Gateway context
  GATEWAY_TIMESTAMP: 'x-gateway-timestamp',
  GATEWAY_VERSION: 'x-gateway-version',

  // Rate limiting
  RATE_LIMIT_LIMIT: 'x-ratelimit-limit',
  RATE_LIMIT_REMAINING: 'x-ratelimit-remaining',
  RATE_LIMIT_RESET: 'x-ratelimit-reset',
} as const;

export type HeaderKey = (typeof HEADERS)[keyof typeof HEADERS];
