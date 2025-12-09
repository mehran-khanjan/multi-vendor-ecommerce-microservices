// src/federation/datasources/authenticated.datasource.ts
import {
  RemoteGraphQLDataSource,
  GraphQLDataSourceProcessOptions,
} from '@apollo/gateway';
import { GraphQLRequest } from 'apollo-server-types';
import { HEADERS } from '@common/constants';

interface DataSourceOptions {
  url: string;
  timeout?: number;
}

export class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  private readonly timeout: number;

  constructor(options: DataSourceOptions) {
    super({ url: options.url });
    this.timeout = options.timeout || 15000;
  }

  /**
   * Called before sending request to subgraph
   */
  willSendRequest(
    options: GraphQLDataSourceProcessOptions<Record<string, any>>,
  ): void {
    const { request, context } = options;
    const req = context?.req;
    const gatewayContext = req?.context;

    if (!request.http) {
      return;
    }

    // Forward request identification
    if (gatewayContext?.requestId) {
      request.http.headers.set(HEADERS.REQUEST_ID, gatewayContext.requestId);
    }

    if (gatewayContext?.correlationId) {
      request.http.headers.set(
        HEADERS.CORRELATION_ID,
        gatewayContext.correlationId,
      );
    }

    // Forward authentication
    const authHeader = req?.headers?.authorization;
    if (authHeader) {
      request.http.headers.set('Authorization', authHeader);
    }

    // Forward user context (if authenticated)
    if (gatewayContext?.user) {
      request.http.headers.set(HEADERS.USER_ID, gatewayContext.user.id);
      request.http.headers.set(HEADERS.USER_EMAIL, gatewayContext.user.email);
      request.http.headers.set(
        HEADERS.USER_ROLES,
        JSON.stringify(gatewayContext.user.roles),
      );
      request.http.headers.set(
        HEADERS.USER_PERMISSIONS,
        JSON.stringify(gatewayContext.user.permissions),
      );

      if (gatewayContext.user.tenantId) {
        request.http.headers.set(
          HEADERS.TENANT_ID,
          gatewayContext.user.tenantId,
        );
      }

      if (gatewayContext.user.vendorId) {
        request.http.headers.set(
          HEADERS.VENDOR_ID,
          gatewayContext.user.vendorId,
        );
      }
    }

    // Forward origin context
    if (gatewayContext?.originDomain) {
      request.http.headers.set(
        HEADERS.ORIGIN_DOMAIN,
        gatewayContext.originDomain,
      );
    }

    if (gatewayContext?.clientIp) {
      request.http.headers.set(HEADERS.FORWARDED_FOR, gatewayContext.clientIp);
    }

    // Set gateway metadata
    request.http.headers.set(HEADERS.GATEWAY_TIMESTAMP, Date.now().toString());
    request.http.headers.set(HEADERS.GATEWAY_VERSION, '1.0.0');
  }

  /**
   * Called after receiving response from subgraph
   */
  async didReceiveResponse({
    response,
    request,
    context,
  }: Required<
    Pick<GraphQLDataSourceProcessOptions, 'response' | 'request' | 'context'>
  >) {
    // Log subgraph response for debugging
    const requestId = context?.req?.context?.requestId;
    const hasErrors = response.errors && response.errors.length > 0;

    if (hasErrors && process.env.DEBUG === 'true') {
      console.debug(
        `[${requestId}] Subgraph response has errors:`,
        JSON.stringify(response.errors, null, 2),
      );
    }

    return response;
  }

  /**
   * Error handling for subgraph requests
   */
  didEncounterError(
    error: Error,
    options: GraphQLDataSourceProcessOptions,
  ): void {
    const requestId = options.context?.req?.context?.requestId || 'unknown';
    console.error(`[${requestId}] Subgraph error: ${error.message}`);
  }
}
