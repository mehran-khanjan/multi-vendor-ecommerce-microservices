// src/common/filters/ws-exception.filter.ts
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { SocketWithAuth } from '../interfaces';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<SocketWithAuth>();
    const userId = client.user?.id || 'anonymous';

    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') {
        errorMessage = error;
        errorCode = 'WS_ERROR';
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || errorMessage;
        errorCode = (error as any).code || errorCode;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(
      `WebSocket error for user ${userId}: ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    client.emit('error', {
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
