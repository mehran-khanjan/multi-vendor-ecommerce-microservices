// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3004,
  environment: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'notification_service',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 3,
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications',
    queues: {
      vendorOrders:
        process.env.RABBITMQ_QUEUE_VENDOR_ORDERS ||
        'notifications.vendor.orders',
      vendorInventory:
        process.env.RABBITMQ_QUEUE_VENDOR_INVENTORY ||
        'notifications.vendor.inventory',
      customerOrders:
        process.env.RABBITMQ_QUEUE_CUSTOMER_ORDERS ||
        'notifications.customer.orders',
      admin: process.env.RABBITMQ_QUEUE_ADMIN || 'notifications.admin',
    },
    prefetch: parseInt(process.env.RABBITMQ_PREFETCH, 10) || 10,
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY, 10) || 5000,
  },

  grpc: {
    authService: {
      url: process.env.AUTH_SERVICE_GRPC_URL || 'localhost:50051',
    },
  },

  socket: {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
      ],
      credentials: true,
    },
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 25000,
    maxConnections: parseInt(process.env.SOCKET_MAX_CONNECTIONS, 10) || 10000,
    connectionsPerUser:
      parseInt(process.env.SOCKET_CONNECTIONS_PER_USER, 10) || 5,
  },

  notification: {
    batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE, 10) || 50,
    retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS, 10) || 30,
    maxPendingPerUser:
      parseInt(process.env.NOTIFICATION_MAX_PENDING, 10) || 100,
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
});
