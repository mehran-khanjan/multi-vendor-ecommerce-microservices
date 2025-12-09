// src/config/app.config.ts
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  apiPrefix: process.env.API_PREFIX || '',
  debug: process.env.DEBUG === 'true',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000,

  complexity: {
    maxComplexity: parseInt(process.env.MAX_QUERY_COMPLEXITY, 10) || 500,
    maxDepth: parseInt(process.env.MAX_QUERY_DEPTH, 10) || 10,
    maxAliases: parseInt(process.env.MAX_QUERY_ALIASES, 10) || 5,
  },

  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 1000,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    includeRequestBody: process.env.LOG_INCLUDE_REQUEST_BODY === 'true',
    includeResponseBody: process.env.LOG_INCLUDE_RESPONSE_BODY === 'true',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },

  health: {
    path: process.env.HEALTH_PATH || '/health',
    subgraphTimeout: parseInt(process.env.HEALTH_SUBGRAPH_TIMEOUT, 10) || 5000,
  },

  graphql: {
    introspectionEnabled: process.env.INTROSPECTION_ENABLED !== 'false',
    playgroundEnabled: process.env.PLAYGROUND_ENABLED !== 'false',
  },

  federation: {
    pollIntervalMs: parseInt(process.env.FEDERATION_POLL_INTERVAL, 10) || 10000,
    supergraphPath: process.env.SUPERGRAPH_PATH || null,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'gateway:',
  },
});
