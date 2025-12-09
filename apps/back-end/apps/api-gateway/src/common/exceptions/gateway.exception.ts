// src/common/exceptions/gateway.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_CODES } from '@common/constants';

export interface GatewayExceptionOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  cause?: Error;
}

export class GatewayException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    options: GatewayExceptionOptions,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(
      {
        code: options.code,
        message: options.message,
        details: options.details,
      },
      status,
    );
    this.code = options.code;
    this.details = options.details;

    if (options.cause) {
      this.cause = options.cause;
    }
  }

  static unauthenticated(
    message = 'Authentication required',
  ): GatewayException {
    return new GatewayException(
      { code: ERROR_CODES.UNAUTHENTICATED, message },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(message = 'Access denied'): GatewayException {
    return new GatewayException(
      { code: ERROR_CODES.FORBIDDEN, message },
      HttpStatus.FORBIDDEN,
    );
  }

  static rateLimited(retryAfter?: number): GatewayException {
    return new GatewayException(
      {
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many requests',
        details: retryAfter ? { retryAfter } : undefined,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  static serviceUnavailable(serviceName: string): GatewayException {
    return new GatewayException(
      {
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: `Service ${serviceName} is currently unavailable`,
        details: { service: serviceName },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static gatewayTimeout(serviceName?: string): GatewayException {
    return new GatewayException(
      {
        code: ERROR_CODES.GATEWAY_TIMEOUT,
        message: serviceName
          ? `Request to ${serviceName} timed out`
          : 'Request timed out',
        details: serviceName ? { service: serviceName } : undefined,
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }

  static queryTooComplex(
    complexity: number,
    maxComplexity: number,
  ): GatewayException {
    return new GatewayException(
      {
        code: ERROR_CODES.QUERY_TOO_COMPLEX,
        message: `Query complexity ${complexity} exceeds maximum allowed ${maxComplexity}`,
        details: { complexity, maxComplexity },
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  static queryTooDeep(depth: number, maxDepth: number): GatewayException {
    return new GatewayException(
      {
        code: ERROR_CODES.QUERY_TOO_DEEP,
        message: `Query depth ${depth} exceeds maximum allowed ${maxDepth}`,
        details: { depth, maxDepth },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
