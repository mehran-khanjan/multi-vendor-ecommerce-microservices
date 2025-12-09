// src/common/interceptors/metrics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '@metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const info = ctx.getInfo();

    const operationName = info?.operation?.name?.value || 'anonymous';
    const operationType = info?.operation?.operation || 'query';
    const originDomain = req?.context?.originDomain || 'unknown';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.metricsService.recordRequest({
            operation: operationName,
            type: operationType,
            domain: originDomain,
            duration,
            success: true,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.metricsService.recordRequest({
            operation: operationName,
            type: operationType,
            domain: originDomain,
            duration,
            success: false,
            errorCode: error?.code || 'UNKNOWN',
          });
        },
      }),
    );
  }
}
