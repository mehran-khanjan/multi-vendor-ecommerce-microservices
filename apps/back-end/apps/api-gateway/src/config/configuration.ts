// src/config/configuration.ts
import appConfig from './app.config';
import authConfig from './auth.config';
import servicesConfig from './services.config';
import rateLimitConfig from './rate-limit.config';
import corsConfig from './cors.config';

export default () => ({
  app: appConfig(),
  auth: authConfig(),
  services: servicesConfig(),
  rateLimit: rateLimitConfig(),
  cors: corsConfig(),
});
