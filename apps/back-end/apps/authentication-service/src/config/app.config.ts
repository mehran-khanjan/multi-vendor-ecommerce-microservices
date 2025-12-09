// src/config/app.config.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4001,
  apiPrefix: process.env.API_PREFIX || '',
  debug: process.env.DEBUG === 'true',
});
