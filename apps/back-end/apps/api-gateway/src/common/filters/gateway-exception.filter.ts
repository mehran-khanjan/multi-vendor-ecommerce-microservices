// src/common/filters/gateway-exception.filter.ts
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ERROR_CODES } from '@common/constants';
import { GatewayException } from '@common/exceptions';

@Catch()
export class GatewayExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GatewayExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let gqlHost: GqlArgumentsHost;
    let requestId = 'unknown';

    try {
      gqlHost = GqlArgumentsHost.create(host);
      const ctx = gqlHost.getContext();
      requestId = ctx?.req?.context?.requestId || 'unknown';
    } catch {
      // Not a GraphQL context
    }

    // Handle GatewayException
    if (exception instanceof GatewayException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          requestId,
          details: exception.details,
        },
      });
    }

    // Handle HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();

      let message: string;
      let code: string;
      let details: any;

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        message = responseObj.message || exception.message;
        code = responseObj.code || this.statusToCode(status);
        details = responseObj.details;
      } else {
        message = exception.message;
        code = this.statusToCode(status);
      }

      return new GraphQLError(message, {
        extensions: {
          code,
          requestId,
          details,
          http: { status },
        },
      });
    }

    // Handle GraphQL errors
    if (exception instanceof GraphQLError) {
      // Add request ID if not present
      const extensions = {
        ...exception.extensions,
        requestId: exception.extensions?.requestId || requestId,
      };

      return new GraphQLError(exception.message, {
        extensions,
        nodes: exception.nodes,
        source: exception.source,
        positions: exception.positions,
        path: exception.path,
        originalError: exception.originalError,
      });
    }

    // Handle generic errors
    if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled error: ${exception.message}`,
        exception.stack,
      );

      // Don't expose internal error details in production
      const isProduction = process.env.NODE_ENV === 'production';

      return new GraphQLError(
        isProduction ? 'Internal server error' : exception.message,
        {
          extensions: {
            code: ERROR_CODES.INTERNAL_ERROR,
            requestId,
            ...(isProduction ? {} : { stack: exception.stack }),
          },
        },
      );
    }

    // Handle unknown errors
    this.logger.error(`[${requestId}] Unknown error type`, exception);

    return new GraphQLError('An unexpected error occurred', {
      extensions: {
        code: ERROR_CODES.INTERNAL_ERROR,
        requestId,
      },
    });
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.BAD_REQUEST;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      case HttpStatus.GATEWAY_TIMEOUT:
        return ERROR_CODES.GATEWAY_TIMEOUT;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }
}
