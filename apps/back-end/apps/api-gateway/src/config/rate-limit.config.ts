// src/config/rate-limit.config.ts
import { OriginDomain } from '@common/enums';

export default () => ({
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,

  // Default limits per role
  limits: {
    anonymous: parseInt(process.env.RATE_LIMIT_ANONYMOUS, 10) || 30,
    customer: parseInt(process.env.RATE_LIMIT_CUSTOMER, 10) || 100,
    vendor: parseInt(process.env.RATE_LIMIT_VENDOR, 10) || 200,
    admin: parseInt(process.env.RATE_LIMIT_ADMIN, 10) || 500,
  },

  // Operation-specific limits
  operationLimits: {
    Login: { windowMs: 60000, max: 10 },
    Register: { windowMs: 60000, max: 5 },
    ForgotPassword: { windowMs: 60000, max: 3 },
    CreateOrder: { windowMs: 60000, max: 10 },
    CreateReview: { windowMs: 60000, max: 5 },
  } as Record<string, { windowMs: number; max: number }>,

  // Domain-specific limits
  domainLimits: {
    [OriginDomain.CUSTOMER]: {
      anonymous: 30,
      authenticated: 100,
    },
    [OriginDomain.VENDOR]: {
      anonymous: 20,
      authenticated: 200,
    },
    [OriginDomain.ADMIN]: {
      anonymous: 10,
      authenticated: 500,
    },
  },

  // Whitelist (bypass rate limiting)
  whitelist: {
    ips: (process.env.RATE_LIMIT_WHITELIST_IPS || '')
      .split(',')
      .filter(Boolean),
    userIds: (process.env.RATE_LIMIT_WHITELIST_USERS || '')
      .split(',')
      .filter(Boolean),
  },
});
