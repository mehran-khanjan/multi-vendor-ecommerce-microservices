// src/metrics/metrics.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';

export interface RequestMetric {
  operation: string;
  type: string;
  domain: string;
  duration: number;
  success: boolean;
  errorCode?: string;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly enabled: boolean;

  // Metrics
  private readonly requestCounter: client.Counter<string>;
  private readonly requestDuration: client.Histogram<string>;
  private readonly requestsInProgress: client.Gauge<string>;
  private readonly errorCounter: client.Counter<string>;
  private readonly cacheHitCounter: client.Counter<string>;
  private readonly subgraphLatency: client.Histogram<string>;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get('app.metrics.enabled', true);

    // Initialize metrics
    this.requestCounter = new client.Counter({
      name: 'graphql_requests_total',
      help: 'Total number of GraphQL requests',
      labelNames: ['operation', 'type', 'domain', 'status'],
    });

    this.requestDuration = new client.Histogram({
      name: 'graphql_request_duration_seconds',
      help: 'GraphQL request duration in seconds',
      labelNames: ['operation', 'type', 'domain'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });

    this.requestsInProgress = new client.Gauge({
      name: 'graphql_requests_in_progress',
      help: 'Number of GraphQL requests in progress',
      labelNames: ['type'],
    });

    this.errorCounter = new client.Counter({
      name: 'graphql_errors_total',
      help: 'Total number of GraphQL errors',
      labelNames: ['operation', 'type', 'error_code'],
    });

    this.cacheHitCounter = new client.Counter({
      name: 'graphql_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['operation'],
    });

    this.subgraphLatency = new client.Histogram({
      name: 'graphql_subgraph_latency_seconds',
      help: 'Subgraph request latency in seconds',
      labelNames: ['subgraph'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });
  }

  onModuleInit() {
    if (this.enabled) {
      // Collect default metrics
      client.collectDefaultMetrics({ prefix: 'gateway_' });
    }
  }

  /**
   * Record a GraphQL request
   */
  recordRequest(metric: RequestMetric): void {
    if (!this.enabled) return;

    const { operation, type, domain, duration, success, errorCode } = metric;

    // Increment request counter
    this.requestCounter.inc({
      operation,
      type,
      domain,
      status: success ? 'success' : 'error',
    });

    // Record duration
    this.requestDuration.observe(
      { operation, type, domain },
      duration / 1000, // Convert to seconds
    );

    // Record error if applicable
    if (!success && errorCode) {
      this.errorCounter.inc({
        operation,
        type,
        error_code: errorCode,
      });
    }
  }

  /**
   * Record request start (for in-progress gauge)
   */
  recordRequestStart(type: string): void {
    if (!this.enabled) return;
    this.requestsInProgress.inc({ type });
  }

  /**
   * Record request end (for in-progress gauge)
   */
  recordRequestEnd(type: string): void {
    if (!this.enabled) return;
    this.requestsInProgress.dec({ type });
  }

  /**
   * Record cache hit
   */
  recordCacheHit(operation: string): void {
    if (!this.enabled) return;
    this.cacheHitCounter.inc({ operation });
  }

  /**
   * Record subgraph latency
   */
  recordSubgraphLatency(subgraph: string, durationMs: number): void {
    if (!this.enabled) return;
    this.subgraphLatency.observe({ subgraph }, durationMs / 1000);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }

  /**
   * Get content type for metrics
   */
  getContentType(): string {
    return client.register.contentType;
  }
}
