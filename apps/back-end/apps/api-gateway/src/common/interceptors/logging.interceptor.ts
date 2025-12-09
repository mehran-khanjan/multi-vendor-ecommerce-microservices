// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQL');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const info = ctx.getInfo();

    const gatewayContext = req?.context;
    const requestId = gatewayContext?.requestId || 'unknown';
    const operationName = info?.operation?.name?.value || 'anonymous';
    const operationType = info?.operation?.operation || 'query';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${requestId}] ${operationType.toUpperCase()} ${operationName} | ${gatewayContext?.originDomain || 'unknown'} | ${duration}ms | SUCCESS`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${requestId}] ${operationType.toUpperCase()} ${operationName} | ${gatewayContext?.originDomain || 'unknown'} | ${duration}ms | ERROR: ${error.message}`,
          );
        },
      }),
    );
  }
}
