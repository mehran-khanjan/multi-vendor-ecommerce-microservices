// src/config/configuration.ts
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import mailConfig from './mail.config';
import redisConfig from './redis.config';

export default () => ({
  app: appConfig(),
  database: databaseConfig(),
  jwt: jwtConfig(),
  mail: mailConfig(),
  redis: redisConfig(),
  graphql: {
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
    introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
    debug: process.env.GRAPHQL_DEBUG === 'true',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION, 10) || 15,
    tokenExpiryHours: parseInt(process.env.TOKEN_EXPIRY_HOURS, 10) || 24,
  },
  twoFactor: {
    appName: process.env.TWO_FACTOR_APP_NAME || 'MultiVendorApp',
    issuer: process.env.TWO_FACTOR_ISSUER || 'multi-vendor-app',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    verifyEmailUrl:
      process.env.VERIFY_EMAIL_URL || 'http://localhost:3000/verify-email',
    resetPasswordUrl:
      process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password',
  },
});
