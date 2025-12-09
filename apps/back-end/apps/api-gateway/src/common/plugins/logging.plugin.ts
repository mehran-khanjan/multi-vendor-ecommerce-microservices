// src/common/plugins/logging.plugin.ts
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger('Apollo');

  async requestDidStart(
    requestContext: any,
  ): Promise<GraphQLRequestListener<any>> {
    const startTime = Date.now();
    const { request, contextValue } = requestContext;
    const requestId = contextValue?.req?.context?.requestId || 'unknown';
    const operationName = request.operationName || 'anonymous';

    this.logger.debug(`[${requestId}] Request started: ${operationName}`);

    return {
      async willSendResponse(ctx) {
        const duration = Date.now() - startTime;
        const errors =
          ctx.response?.body?.kind === 'single'
            ? ctx.response.body.singleResult.errors
            : [];

        if (errors && errors.length > 0) {
          this.logger.warn(
            `[${requestId}] Request completed with errors: ${operationName} | ${duration}ms | ${errors.length} error(s)`,
          );
        } else {
          this.logger.debug(
            `[${requestId}] Request completed: ${operationName} | ${duration}ms`,
          );
        }
      },

      async didEncounterErrors(ctx) {
        for (const error of ctx.errors) {
          this.logger.error(
            `[${requestId}] GraphQL Error: ${error.message}`,
            error.extensions,
          );
        }
      },
    };
  }
}
