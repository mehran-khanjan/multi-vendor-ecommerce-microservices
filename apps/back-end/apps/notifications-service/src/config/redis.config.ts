// src/config/redis.config.ts
export const REDIS_KEYS = {
  CONNECTION_PREFIX: 'ws:connection:',
  USER_CONNECTIONS: 'ws:user:connections:',
  USER_LAST_SEEN: 'ws:user:last_seen:',
  ROOM_MEMBERS: 'ws:room:members:',
  RATE_LIMIT: 'ws:rate_limit:',
  NOTIFICATION_SENT: 'notification:sent:',
} as const;

export const REDIS_TTL = {
  CONNECTION: 86400, // 24 hours
  LAST_SEEN: 604800, // 7 days
  RATE_LIMIT: 60, // 1 minute
  NOTIFICATION_DEDUP: 300, // 5 minutes
} as const;
