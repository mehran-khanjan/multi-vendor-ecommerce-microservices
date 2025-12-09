// src/common/filters/graphql-exception.filter.ts
import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { AuthException } from '@common/exceptions';
import { ERROR_CODES } from '@common/constants';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    const requestId = context?.req?.headers?.['x-request-id'] || 'unknown';

    // Handle AuthException
    if (exception instanceof AuthException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          details: exception.details,
          requestId,
        },
      });
    }

    // Handle HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();

      let message: string;
      let code: string;

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        message = responseObj.message || exception.message;
        code = responseObj.code || this.getCodeFromStatus(status);
      } else {
        message = exception.message;
        code = this.getCodeFromStatus(status);
      }

      return new GraphQLError(message, {
        extensions: {
          code,
          requestId,
        },
      });
    }

    // Handle GraphQL errors
    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Handle generic errors
    if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Unhandled error: ${exception.message}`,
        exception.stack,
      );

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

    // Unknown error
    this.logger.error(`[${requestId}] Unknown error type`, exception);

    return new GraphQLError('An unexpected error occurred', {
      extensions: {
        code: ERROR_CODES.INTERNAL_ERROR,
        requestId,
      },
    });
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case 401:
        return ERROR_CODES.UNAUTHORIZED;
      case 403:
        return ERROR_CODES.FORBIDDEN;
      case 404:
        return ERROR_CODES.NOT_FOUND;
      case 400:
        return ERROR_CODES.VALIDATION_ERROR;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }
}
