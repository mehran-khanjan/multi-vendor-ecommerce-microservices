// src/common/interfaces/service-config.interface.ts
export interface ServiceHealthStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  lastChecked: Date;
  error?: string;
}
