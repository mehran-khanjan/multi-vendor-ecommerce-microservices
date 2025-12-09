// src/config/cors.config.ts
export default () => ({
  customerOrigins: (process.env.CUSTOMER_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  vendorOrigins: (process.env.VENDOR_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  adminOrigins: (process.env.ADMIN_ORIGINS || 'http://localhost:3002')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
});
