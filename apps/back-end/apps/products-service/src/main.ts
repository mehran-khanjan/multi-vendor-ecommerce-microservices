// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggingInterceptor } from '@common/interceptors';
import { HttpExceptionFilter } from '@common/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Get config service
  const configService = app.get(ConfigService);

  // Environment configuration
  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const serviceName = configService.get<string>(
    'serviceName',
    'product-service',
  );

  // Security middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string[]>('cors.origins', [
      'http://localhost:3000',
    ]),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'X-Tenant-ID',
      'X-User-Context',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: nodeEnv === 'production',
      validateCustomDecorators: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // API versioning (optional - for REST endpoints if needed)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Trust proxy (for services behind load balancer/reverse proxy)
  app.set('trust proxy', true);

  // Graceful shutdown configuration
  app.enableShutdownHooks();

  // Start the application
  await app.listen(port, '0.0.0.0');

  // Log startup information
  logger.log(`🚀 ${serviceName} is running on: http://localhost:${port}`);
  logger.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`🌍 Environment: ${nodeEnv}`);

  // Log federation info
  logger.log(`🔗 Apollo Federation 2.0 enabled`);

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);

      try {
        await app.close();
        logger.log('Application closed gracefully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', error);
        process.exit(1);
      }
    });
  });

  // Unhandled rejection handling
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Uncaught exception handling
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
