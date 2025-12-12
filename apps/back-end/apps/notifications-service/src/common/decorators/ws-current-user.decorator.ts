// src/common/decorators/ws-current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SocketWithAuth } from '../interfaces';

export const WsCurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const client = context.switchToWs().getClient<SocketWithAuth>();
    return client.user;
  },
);
