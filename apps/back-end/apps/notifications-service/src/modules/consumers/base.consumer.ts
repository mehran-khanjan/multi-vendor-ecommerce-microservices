// src/modules/consumers/base.consumer.ts
import { Logger } from '@nestjs/common';
import { RabbitMQService } from '@modules/rabbitmq/rabbitmq.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RedisService } from '@modules/redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from '@config/redis.config';
import { RabbitMQMessage } from '@common/interfaces';

export abstract class BaseConsumer {
  protected readonly logger: Logger;
  protected abstract readonly queueName: string;

  constructor(
    protected readonly rabbitMQService: RabbitMQService,
    protected readonly notificationsService: NotificationsService,
    protected readonly redisService: RedisService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async startConsuming(): Promise<void> {
    await this.rabbitMQService.consume(
      this.queueName,
      async (message: RabbitMQMessage, ack, nack) => {
        const startTime = Date.now();

        try {
          // Check for duplicate message
          const isDuplicate = await this.isDuplicateMessage(message.id);
          if (isDuplicate) {
            this.logger.debug(`Duplicate message ignored: ${message.id}`);
            ack();
            return;
          }

          // Process message
          await this.processMessage(message);

          // Mark as processed
          await this.markMessageProcessed(message.id);

          // Acknowledge
          ack();

          const duration = Date.now() - startTime;
          this.logger.debug(
            `Message processed: ${message.type} (${message.id}) - ${duration}ms`,
          );
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Message processing failed: ${message.type} (${message.id}) - ${duration}ms - ${error.message}`,
            error.stack,
          );

          // Check retry count
          const retryCount = message.metadata?.retryCount || 0;
          const maxRetries = 3;

          if (retryCount < maxRetries) {
            // Requeue with increased retry count
            this.logger.warn(
              `Requeueing message: ${message.id} (retry ${retryCount + 1})`,
            );
            nack(true); // Requeue
          } else {
            // Send to DLQ
            this.logger.error(
              `Message sent to DLQ after ${maxRetries} retries: ${message.id}`,
            );
            nack(false); // Don't requeue
          }
        }
      },
    );

    this.logger.log(`Started consuming from queue: ${this.queueName}`);
  }

  protected abstract processMessage(message: RabbitMQMessage): Promise<void>;

  private async isDuplicateMessage(messageId: string): Promise<boolean> {
    const key = `${REDIS_KEYS.NOTIFICATION_SENT}${messageId}`;
    return this.redisService.exists(key);
  }

  private async markMessageProcessed(messageId: string): Promise<void> {
    const key = `${REDIS_KEYS.NOTIFICATION_SENT}${messageId}`;
    await this.redisService.set(key, '1', REDIS_TTL.NOTIFICATION_DEDUP);
  }
}
