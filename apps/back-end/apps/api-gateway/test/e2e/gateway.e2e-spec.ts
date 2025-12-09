import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@modules/app/app.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';

// Mock external dependencies
jest.mock('@apollo/gateway', () => ({
    IntrospectAndCompose: jest.fn(() => ({})),
    RemoteGraphQLDataSource: jest.fn(() => ({
        willSendRequest: jest.fn(),
        didReceiveResponse: jest.fn(),
    })),
}));

describe('GraphQL Gateway (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [
                        () => ({
                            app: {
                                nodeEnv: 'test',
                                port: 0,
                                apiPrefix: '',
                                requestTimeout: 30000,
                                complexity: {
                                    maxComplexity: 500,
                                    maxDepth: 10,
                                    maxAliases: 5,
                                },
                                graphql: {
                                    introspectionEnabled: true,
                                    playgroundEnabled: false,
                                },
                            },
                            auth: {
                                jwt: {
                                    secret: 'test-secret',
                                },
                                publicOperations: ['IntrospectionQuery', 'Login', 'Register'],
                            },
                            cors: {
                                customerOrigins: ['http://localhost:3000'],
                                vendorOrigins: ['http://localhost:3001'],
                                adminOrigins: ['http://localhost:3002'],
                            },
                            rateLimit: {
                                enabled: false, // Disable for testing
                            },
                        }),
                    ],
                }),
                CacheModule.register({
                    isGlobal: true,
                    store: 'memory',
                }),
                ThrottlerModule.forRoot([]),
                AppModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Health Check Endpoints', () => {
        it('/health (GET) should return health status', () => {
            return request(app.getHttpServer())
                .get('/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('ok');
                    expect(res.body.info).toBeDefined();
                });
        });

        it('/health/live (GET) should return liveness status', () => {
            return request(app.getHttpServer())
                .get('/health/live')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('ok');
                    expect(res.body.timestamp).toBeDefined();
                });
        });

        it('/health/ready (GET) should return readiness status', () => {
            return request(app.getHttpServer())
                .get('/health/ready')
                .expect(200)
                .expect((res) => {
                    expect(['ready', 'not_ready']).toContain(res.body.status);
                    expect(res.body.services).toBeDefined();
                });
        });

        it('/metrics (GET) should return Prometheus metrics', () => {
            return request(app.getHttpServer())
                .get('/metrics')
                .expect(200)
                .expect('Content-Type', /text\/plain/)
                .expect((res) => {
                    expect(res.text).toContain('graphql_requests_total');
                });
        });
    });

    describe('GraphQL Endpoint', () => {
        it('should execute GraphQL introspection query', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            query IntrospectionQuery {
              __schema {
                queryType { name }
                mutationType { name }
                subscriptionType { name }
              }
            }
          `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data).toBeDefined();
                    expect(res.body.data.__schema).toBeDefined();
                });
        });

        it('should handle GraphQL errors properly', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            query InvalidQuery {
              nonExistentField
            }
          `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.errors).toBeDefined();
                    expect(res.body.errors[0].extensions.code).toBeDefined();
                });
        });

        it('should include request ID in error responses', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .set('x-request-id', 'test-request-123')
                .send({
                    query: `
            query InvalidQuery {
              nonExistentField
            }
          `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.errors[0].extensions.requestId).toBe('test-request-123');
                });
        });

        it('should handle batched GraphQL requests', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send([
                    {
                        query: 'query { __typename }',
                    },
                    {
                        query: 'query { __schema { queryType { name } } }',
                    },
                ])
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body[0].data.__typename).toBe('Query');
                });
        });

        it('should respect operationName in requests', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({
                    operationName: 'IntrospectionQuery',
                    query: `
            query IntrospectionQuery { __typename }
            query AnotherQuery { __schema { queryType { name } } }
          `,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.__typename).toBe('Query');
                });
        });
    });

    describe('Request Context Middleware', () => {
        it('should propagate request ID through headers', () => {
            const requestId = 'test-request-456';

            return request(app.getHttpServer())
                .post('/graphql')
                .set('x-request-id', requestId)
                .send({
                    query: 'query { __typename }',
                })
                .expect(200)
                .expect((res) => {
                    // Check response headers
                    expect(res.headers['x-request-id']).toBe(requestId);
                    expect(res.headers['x-correlation-id']).toBeDefined();
                });
        });

        it('should generate new request ID when not provided', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: 'query { __typename }',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.headers['x-request-id']).toBeDefined();
                    expect(res.headers['x-correlation-id']).toBeDefined();
                });
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed GraphQL requests', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({}) // Empty body
                .expect(400)
                .expect((res) => {
                    expect(res.body.errors).toBeDefined();
                });
        });

        it('should handle invalid JSON', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });

        it('should handle non-POST methods gracefully', () => {
            return request(app.getHttpServer())
                .get('/graphql')
                .expect(405); // Method Not Allowed
        });
    });
});