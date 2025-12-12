// src/modules/rabbitmq/rabbitmq.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { EXCHANGES, QUEUES, ROUTING_KEYS } from '@config/rabbitmq.config';

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
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('rabbitmq.url');
  }

  async onModuleInit() {
    await this.connect();
    await this.setupExchangesAndQueues();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      const prefetch = this.configService.get<number>('rabbitmq.prefetch');
      await this.channel.prefetch(prefetch);

      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });

      this.logger.log('RabbitMQ connection established');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      this.handleReconnect();
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    setTimeout(async () => {
      await this.connect();
      if (this.isConnected) {
        await this.setupExchangesAndQueues();
      }
    }, this.reconnectDelay);
  }

  private async setupExchangesAndQueues(): Promise<void> {
    try {
      // Create main exchange
      await this.channel.assertExchange(EXCHANGES.NOTIFICATIONS, 'topic', {
        durable: true,
      });

      // Create dead letter exchange
      await this.channel.assertExchange(EXCHANGES.NOTIFICATIONS_DLX, 'topic', {
        durable: true,
      });

      // Create dead letter queue
      await this.channel.assertQueue(QUEUES.DEAD_LETTER, {
        durable: true,
      });
      await this.channel.bindQueue(
        QUEUES.DEAD_LETTER,
        EXCHANGES.NOTIFICATIONS_DLX,
        '#',
      );

      // Create vendor orders queue
      await this.channel.assertQueue(QUEUES.VENDOR_ORDERS, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGES.NOTIFICATIONS_DLX,
          'x-dead-letter-routing-key': 'dead.vendor.orders',
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      await this.channel.bindQueue(
        QUEUES.VENDOR_ORDERS,
        EXCHANGES.NOTIFICATIONS,
        'vendor.order.*',
      );

      // Create vendor inventory queue
      await this.channel.assertQueue(QUEUES.VENDOR_INVENTORY, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGES.NOTIFICATIONS_DLX,
          'x-dead-letter-routing-key': 'dead.vendor.inventory',
          'x-message-ttl': 86400000,
        },
      });
      await this.channel.bindQueue(
        QUEUES.VENDOR_INVENTORY,
        EXCHANGES.NOTIFICATIONS,
        'vendor.inventory.*',
      );

      // Create customer orders queue
      await this.channel.assertQueue(QUEUES.CUSTOMER_ORDERS, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGES.NOTIFICATIONS_DLX,
          'x-dead-letter-routing-key': 'dead.customer.orders',
          'x-message-ttl': 86400000,
        },
      });
      await this.channel.bindQueue(
        QUEUES.CUSTOMER_ORDERS,
        EXCHANGES.NOTIFICATIONS,
        'customer.order.*',
      );

      // Create admin queue
      await this.channel.assertQueue(QUEUES.ADMIN, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGES.NOTIFICATIONS_DLX,
          'x-dead-letter-routing-key': 'dead.admin',
          'x-message-ttl': 86400000,
        },
      });
      await this.channel.bindQueue(
        QUEUES.ADMIN,
        EXCHANGES.NOTIFICATIONS,
        'admin.#',
      );

      this.logger.log('RabbitMQ exchanges and queues configured');
    } catch (error) {
      this.logger.error(
        `Failed to setup exchanges and queues: ${error.message}`,
      );
      throw error;
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
      const publishOptions: amqp.Options.Publish = {
        persistent: options.persistent ?? true,
        priority: options.priority,
        expiration: options.expiration,
        headers: options.headers,
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      const result = this.channel.publish(
        EXCHANGES.NOTIFICATIONS,
        routingKey,
        content,
        publishOptions,
      );

      if (result) {
        this.logger.debug(`Message published to ${routingKey}`);
      } else {
        this.logger.warn(
          `Message not published to ${routingKey}: channel buffer full`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`);
      return false;
    }
  }

  async consume(
    queue: string,
    callback: (
      message: any,
      ack: () => void,
      nack: (requeue?: boolean) => void,
    ) => Promise<void>,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Cannot consume: not connected to RabbitMQ');
    }

    try {
      await this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());

            const ack = () => this.channel.ack(msg);
            const nack = (requeue = false) =>
              this.channel.nack(msg, false, requeue);

            await callback(content, ack, nack);
          } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`);
            // Nack without requeue - send to DLQ
            this.channel.nack(msg, false, false);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Started consuming from queue: ${queue}`);
    } catch (error) {
      this.logger.error(
        `Failed to start consumer for ${queue}: ${error.message}`,
      );
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.isConnected = false;
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error(`Error closing RabbitMQ connection: ${error.message}`);
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
