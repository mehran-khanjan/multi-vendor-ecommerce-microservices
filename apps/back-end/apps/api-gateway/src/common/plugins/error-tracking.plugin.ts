// src/common/plugins/error-tracking.plugin.ts
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import { ERROR_CODES } from '@common/constants';

interface ErrorStats {
  count: number;
  lastOccurred: Date;
  operations: Set<string>;
}

@Plugin()
export class ErrorTrackingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger('ErrorTracking');
  private readonly errorStats = new Map<string, ErrorStats>();

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      didEncounterErrors: async (ctx) => {
        const operationName = ctx.request.operationName || 'anonymous';
        const requestId =
          ctx.contextValue?.req?.context?.requestId || 'unknown';

        for (const error of ctx.errors) {
          const code =
            (error.extensions?.code as string) || ERROR_CODES.INTERNAL_ERROR;

          // Update error stats
          const stats = this.errorStats.get(code) || {
            count: 0,
            lastOccurred: new Date(),
            operations: new Set<string>(),
          };

          stats.count++;
          stats.lastOccurred = new Date();
          stats.operations.add(operationName);

          this.errorStats.set(code, stats);

          // Log critical errors
          if (this.isCriticalError(code)) {
            this.logger.error(
              `[${requestId}] Critical error in ${operationName}: ${error.message}`,
              {
                code,
                path: error.path,
                extensions: error.extensions,
              },
            );
          }
        }
      },
    };
  }

  private isCriticalError(code: string): boolean {
    const criticalCodes = [
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      ERROR_CODES.GATEWAY_TIMEOUT,
      ERROR_CODES.BAD_GATEWAY,
    ];
    return criticalCodes.includes(code as any);
  }

  getErrorStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.errorStats.forEach((value, key) => {
      stats[key] = {
        count: value.count,
        lastOccurred: value.lastOccurred,
        operations: Array.from(value.operations),
      };
    });
    return stats;
  }
}
