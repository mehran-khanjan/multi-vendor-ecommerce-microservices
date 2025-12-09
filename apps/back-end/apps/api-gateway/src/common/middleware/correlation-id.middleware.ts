// src/common/middleware/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HEADERS } from '@common/constants';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing or generate new request ID
    const requestId = (req.headers[HEADERS.REQUEST_ID] as string) || uuidv4();

    // Use existing or generate new correlation ID
    const correlationId =
      (req.headers[HEADERS.CORRELATION_ID] as string) || requestId;

    // Set on request
    req.headers[HEADERS.REQUEST_ID] = requestId;
    req.headers[HEADERS.CORRELATION_ID] = correlationId;

    // Set on response
    res.setHeader(HEADERS.REQUEST_ID, requestId);
    res.setHeader(HEADERS.CORRELATION_ID, correlationId);

    next();
  }
}
