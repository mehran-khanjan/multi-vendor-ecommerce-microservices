// src/common/plugins/complexity.plugin.ts
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import {
  getComplexity,
  simpleEstimator,
  fieldExtensionsEstimator,
} from 'graphql-query-complexity';
import { GraphQLSchema } from 'graphql';
import { GatewayException } from '@common/exceptions';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger(ComplexityPlugin.name);
  private readonly maxComplexity: number;
  private readonly maxDepth: number;
  private readonly maxAliases: number;

  constructor(private readonly configService: ConfigService) {
    this.maxComplexity = this.configService.get(
      'app.complexity.maxComplexity',
      500,
    );
    this.maxDepth = this.configService.get('app.complexity.maxDepth', 10);
    this.maxAliases = this.configService.get('app.complexity.maxAliases', 5);
  }

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const maxComplexity = this.maxComplexity;
    const maxDepth = this.maxDepth;
    const logger = this.logger;

    return {
      async didResolveOperation(requestContext) {
        const { request, document, schema, contextValue } = requestContext;
        const requestId = contextValue?.req?.context?.requestId || 'unknown';

        // Calculate complexity
        const complexity = getComplexity({
          schema: schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });

        logger.debug(`[${requestId}] Query complexity: ${complexity}`);

        if (complexity > maxComplexity) {
          logger.warn(
            `[${requestId}] Query complexity ${complexity} exceeds limit ${maxComplexity}`,
          );
          throw GatewayException.queryTooComplex(complexity, maxComplexity);
        }

        // Check depth (simplified - could use graphql-depth-limit for more accuracy)
        // This is handled by the OperationParser in middleware
      },
    };
  }
}
