// order-service/src/modules/rabbitmq/rabbitmq.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  headers?: Record<string, any>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly url: string;
  private readonly exchange: string;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.url =
      this.configService.get<string>('rabbitmq.url') ||
      'amqp://guest:guest@localhost:5672';
    this.exchange =
      this.configService.get<string>('rabbitmq.exchange') || 'notifications';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Assert the exchange exists
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      this.isConnected = true;
      this.logger.log('RabbitMQ connection established');

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(
    routingKey: string,
    message: any,
    options: PublishOptions = {},
  ): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.error('Cannot publish: not connected to RabbitMQ');
      return false;
    }

    try {
      const content = Buffer.from(JSON.stringify(message));

      const result = this.channel.publish(this.exchange, routingKey, content, {
        persistent: options.persistent ?? true,
        contentType: 'application/json',
        timestamp: Date.now(),
        ...options,
      });

      if (result) {
        this.logger.debug(`Message published to ${routingKey}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.isConnected = false;
    } catch (error) {
      this.logger.error(`Error closing RabbitMQ connection: ${error.message}`);
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
