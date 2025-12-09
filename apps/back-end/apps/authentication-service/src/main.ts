// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GraphQLExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
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

  // Global filters and interceptors
  app.useGlobalFilters(new GraphQLExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Shutdown hooks
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port', 4001);
  await app.listen(port);

  logger.log(`🚀 Auth Service running on http://localhost:${port}/graphql`);
}

bootstrap();
