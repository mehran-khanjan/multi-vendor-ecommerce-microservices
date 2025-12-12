// src/common/interceptors/ws-logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SocketWithAuth } from '../interfaces';

@Injectable()
export class WsLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WebSocket');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient<SocketWithAuth>();
    const event = context.switchToWs().getPattern();
    const data = context.switchToWs().getData();
    const userId = client.user?.id || 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${event}] User: ${userId} - Duration: ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${event}] User: ${userId} - Duration: ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
