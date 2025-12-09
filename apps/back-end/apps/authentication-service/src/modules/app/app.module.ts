// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { join } from 'path';

import configuration from '@config/configuration';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { RolesModule } from '@modules/roles/roles.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { CaslModule } from '@modules/casl/casl.module';
import { MailModule } from '@modules/mail/mail.module';
import { HealthModule } from '@modules/health/health.module';
import { RequestContextMiddleware } from '@common/middleware';
import { buildSubgraphSchema } from '@apollo/subgraph';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),

    // GraphQL with Apollo Federation
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: {
          federation: 2,
          path: join(process.cwd(), 'src/schema.gql'),
        },
        sortSchema: true,
        playground: false,
        plugins: [
          ...(configService.get('graphql.playground')
            ? [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
            : []),
        ],
        introspection: configService.get('graphql.introspection', true),
        context: ({ req, res }) => ({ req, res }),
        formatError: (error) => {
          const originalError = error.extensions?.originalError as any;

          return {
            message: error.message,
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            path: error.path,
            ...(process.env.NODE_ENV !== 'production' && {
              locations: error.locations,
              extensions: error.extensions,
            }),
          };
        },
      }),
    }),

    // Database
    DatabaseModule,

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        password: configService.get('redis.password'),
        db: configService.get('redis.db'),
        ttl: 300,
        keyPrefix: configService.get('redis.keyPrefix'),
      }),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    CaslModule,
    MailModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
