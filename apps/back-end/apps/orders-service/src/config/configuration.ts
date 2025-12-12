// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3003,
  grpcPort: parseInt(process.env.GRPC_PORT, 10) || 50053,

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'order_service',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 2,
  },

  grpc: {
    authService: {
      url: process.env.AUTH_SERVICE_GRPC_URL || 'localhost:50051',
    },
    productService: {
      url: process.env.PRODUCT_SERVICE_GRPC_URL || 'localhost:50052',
    },
  },

  graphql: {
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
    introspection: process.env.GRAPHQL_INTROSPECTION !== 'false',
  },

  order: {
    stockReservationTtl: parseInt(process.env.STOCK_RESERVATION_TTL, 10) || 900, // 15 minutes
    orderNumberPrefix: process.env.ORDER_NUMBER_PREFIX || 'ORD',
  },

  payment: {
    encryptionKey:
      process.env.PAYMENT_ENCRYPTION_KEY || 'your-32-character-secret-key!!',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications',
  },
});
