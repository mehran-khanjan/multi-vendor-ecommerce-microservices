// src/config/jwt.config.ts
export default () => ({
  secret: process.env.JWT_SECRET || 'super-secret-key',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUDIENCE || 'multi-vendor-app',
});
