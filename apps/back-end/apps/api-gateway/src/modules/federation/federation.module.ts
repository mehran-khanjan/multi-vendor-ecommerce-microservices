// src/federation/federation.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloGatewayDriver,
  ApolloGatewayDriverConfig,
} from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { FederationService } from './federation.service';
import { AuthenticatedDataSource } from './datasources/authenticated.datasource';
import {
  ComplexityPlugin,
  LoggingPlugin,
  ErrorTrackingPlugin,
} from '@common/plugins';
import {
  AuthGuard,
  DomainRestrictionGuard,
  RateLimitGuard,
} from '@common/guards';

@Module({
  imports: [
    HttpModule,
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const subgraphs = configService.get('services.subgraphs', []);
        const pollIntervalMs = configService.get(
          'app.federation.pollIntervalMs',
          10000,
        );
        const introspectionEnabled = configService.get(
          'app.graphql.introspectionEnabled',
          true,
        );
        const playgroundEnabled = configService.get(
          'app.graphql.playgroundEnabled',
          true,
        );

        return {
          gateway: {
            supergraphSdl: new IntrospectAndCompose({
              subgraphs: subgraphs.map((sg: any) => ({
                name: sg.name,
                url: sg.url,
              })),
              pollIntervalInMs: pollIntervalMs,
              subgraphHealthCheck: true,
            }),
            buildService: ({ name, url }) => {
              const subgraph = subgraphs.find((sg: any) => sg.name === name);
              return new AuthenticatedDataSource({
                url,
                timeout: subgraph?.timeout || 15000,
              });
            },
          },
          server: {
            introspection: introspectionEnabled,
            plugins: [
              ...(playgroundEnabled
                ? [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
                : []),
            ],
            context: ({ req, res }) => ({
              req,
              res,
            }),
            formatError: (formattedError, error) => {
              // Add request ID to all errors
              const requestId = error?.extensions?.requestId || 'unknown';

              return {
                ...formattedError,
                extensions: {
                  ...formattedError.extensions,
                  requestId,
                  timestamp: new Date().toISOString(),
                },
              };
            },
          },
        };
      },
    }),
  ],
  providers: [
    FederationService,
    ComplexityPlugin,
    LoggingPlugin,
    ErrorTrackingPlugin,
    AuthGuard,
    DomainRestrictionGuard,
    RateLimitGuard,
  ],
  exports: [FederationService],
})
export class FederationModule {}
