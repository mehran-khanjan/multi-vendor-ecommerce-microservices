// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import helmet from 'helmet';
import { AppModule } from './app.module';

class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(
    host: string,
    port: number,
    password?: string,
  ): Promise<void> {
    const pubClient = createClient({
      socket: { host, port },
      password,
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);

    Logger.log('Redis adapter connected for Socket.IO', 'RedisIoAdapter');
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      },
      pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
      pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
      transports: ['websocket', 'polling'],
    });

    server.adapter(this.adapterConstructor);

    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // Validation pipe
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

  // Setup Redis adapter for Socket.IO
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(
    configService.get<string>('redis.host'),
    configService.get<number>('redis.port'),
    configService.get<string>('redis.password'),
  );
  app.useWebSocketAdapter(redisIoAdapter);

  const port = configService.get<number>('port');
  await app.listen(port);

  logger.log(`Notification service running on port ${port}`);
  logger.log(`WebSocket namespaces: /vendor, /customer, /admin`);
}

bootstrap();
