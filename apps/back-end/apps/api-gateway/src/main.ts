import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './modules/app/app.module';
import { GatewayExceptionFilter } from '@common/filters';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  MetricsInterceptor,
} from '@common/interceptors';
import { MetricsService } from '@metrics/metrics.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const metricsService = app.get(MetricsService);

  // Trust proxy (for X-Forwarded-* headers)
  app.set('trust proxy', true);

  // Security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`, 'cdn.jsdelivr.net'],
        },
      },
    }),
  );

  // Compression
  app.use(compression());

  // CORS
  const corsOrigins = [
    ...configService.get<string[]>('cors.customerOrigins', []),
    ...configService.get<string[]>('cors.vendorOrigins', []),
    ...configService.get<string[]>('cors.adminOrigins', []),
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'X-Tenant-ID',
      'Apollo-Require-Preflight',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
    maxAge: 86400,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GatewayExceptionFilter());

  // Global interceptors
  const requestTimeout = configService.get<number>('app.requestTimeout', 30000);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(requestTimeout),
    new MetricsInterceptor(metricsService),
  );

  // Shutdown hooks
  app.enableShutdownHooks();

  const port = 4000;
  const port = configService.get<number>('app.port', 4000);
  await app.listen(port);

  logger.log(`🚀 GraphQL Gateway running on http://localhost:${port}/graphql`);
  logger.log(`📊 Health check available at http://localhost:${port}/health`);
  logger.log(`📈 Metrics available at http://localhost:${port}/metrics`);
}

bootstrap();
