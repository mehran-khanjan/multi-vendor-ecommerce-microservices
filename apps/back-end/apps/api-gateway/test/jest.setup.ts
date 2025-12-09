import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import * as redisStore from 'cache-manager-redis-store';

// Global test configuration
jest.setTimeout(30000);

// Mock Redis for testing
jest.mock('cache-manager-redis-store', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        reset: jest.fn(),
    })),
}));

// Mock external dependencies
jest.mock('@apollo/gateway', () => ({
    IntrospectAndCompose: jest.fn(() => ({})),
    RemoteGraphQLDataSource: jest.fn(() => ({
        willSendRequest: jest.fn(),
        didReceiveResponse: jest.fn(),
        didEncounterError: jest.fn(),
    })),
}));

// Global test utilities
export const createTestingModule = async (moduleMetadata: any) => {
    const moduleRef = await Test.createTestingModule({
        ...moduleMetadata,
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                load: [
                    () => ({
                        app: {
                            nodeEnv: 'test',
                            port: 4000,
                            requestTimeout: 30000,
                            complexity: {
                                maxComplexity: 500,
                                maxDepth: 10,
                                maxAliases: 5,
                            },
                        },
                        auth: {
                            jwt: {
                                secret: 'test-secret',
                                issuer: 'test-issuer',
                                audience: 'test-audience',
                            },
                            publicOperations: ['Login', 'Register'],
                        },
                        cors: {
                            customerOrigins: ['http://localhost:3000'],
                            vendorOrigins: ['http://localhost:3001'],
                            adminOrigins: ['http://localhost:3002'],
                        },
                        rateLimit: {
                            enabled: true,
                            windowMs: 60000,
                            limits: {
                                anonymous: 30,
                                customer: 100,
                                vendor: 200,
                                admin: 500,
                            },
                        },
                    }),
                ],
            }),
            CacheModule.register({
                isGlobal: true,
                store: 'memory',
                ttl: 300,
            }),
            HttpModule,
            ...(moduleMetadata.imports || []),
        ],
    }).compile();

    return moduleRef;
};

// Global mocks
export const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
};

export const mockRequest = {
    headers: {
        'x-request-id': 'test-request-id',
        'x-correlation-id': 'test-correlation-id',
        authorization: 'Bearer test-token',
        'user-agent': 'Test-Agent',
    },
    ip: '127.0.0.1',
    method: 'POST',
    path: '/graphql',
    body: {
        operationName: 'TestOperation',
        query: 'query TestOperation { __typename }',
        variables: {},
    },
    context: {
        requestId: 'test-request-id',
        correlationId: 'test-correlation-id',
        originDomain: 'customer',
        user: null,
        isAuthenticated: false,
        clientIp: '127.0.0.1',
    },
};

export const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn(() => mockResponse),
    json: jest.fn(),
    send: jest.fn(),
};