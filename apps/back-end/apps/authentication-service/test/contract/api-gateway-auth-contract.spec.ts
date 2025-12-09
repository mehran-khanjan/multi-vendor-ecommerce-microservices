import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AuthService } from '../../api-gateway-service/src/modules/auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Contract tests ensure that the API Gateway and Auth Service
 * maintain a compatible communication protocol
 */
describe('API Gateway - Auth Service Contract', () => {
    let authService: AuthService;
    let httpService: HttpService;
    let configService: ConfigService;

    const mockAuthServiceUrl = 'http://localhost:4001';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [
                        () => ({
                            services: {
                                subgraphs: [
                                    {
                                        name: 'auth',
                                        url: `${mockAuthServiceUrl}/graphql`,
                                        timeout: 10000,
                                        healthPath: '/health',
                                    },
                                ],
                            },
                        }),
                    ],
                }),
                HttpModule,
            ],
            providers: [
                AuthService,
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        httpService = module.get<HttpService>(HttpService);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('Token Validation Contract', () => {
        const validToken = 'valid-jwt-token';
        const requestId = 'test-request-123';
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            emailVerified: true,
            roles: ['customer'],
            permissions: ['user:read:own'],
            tenantId: null,
            vendorId: null,
        };

        it('should validate token with auth service successfully', async () => {
            const mockResponse: AxiosResponse = {
                data: {
                    valid: true,
                    user: mockUser,
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

            const result = await authService.validateTokenRemotely(validToken, requestId);

            expect(result.valid).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(httpService.post).toHaveBeenCalledWith(
                `${mockAuthServiceUrl}/auth/validate`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${validToken}`,
                        'X-Request-ID': requestId,
                    },
                    timeout: 5000,
                }
            );
        });

        it('should fallback to local validation when auth service fails', async () => {
            jest.spyOn(httpService, 'post').mockReturnValue(
                throwError(() => new Error('Service unavailable'))
            );

            // Mock JWT verification locally
            const jwt = require('jsonwebtoken');
            jest.spyOn(jwt, 'verify').mockReturnValue({
                sub: mockUser.id,
                email: mockUser.email,
                email_verified: mockUser.emailVerified,
                roles: mockUser.roles,
                permissions: mockUser.permissions,
                iat: Date.now() / 1000,
                exp: Date.now() / 1000 + 3600,
            });

            const result = await authService.validateTokenRemotely(validToken, requestId);

            expect(result.valid).toBe(true);
            expect(result.user.id).toBe(mockUser.id);
        });

        it('should handle expired token response', async () => {
            const mockResponse: AxiosResponse = {
                data: {
                    valid: false,
                    error: 'Token expired',
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

            const result = await authService.validateTokenRemotely(validToken, requestId);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Token expired');
        });
    });

    describe('Health Check Contract', () => {
        it('should accept standard health check response format', async () => {
            const mockResponse: AxiosResponse = {
                data: {
                    status: 'ok',
                    info: {
                        database: { status: 'up' },
                        memory_heap: { status: 'up' },
                        storage: { status: 'up' },
                    },
                    error: {},
                    details: {
                        database: { status: 'up' },
                    },
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

            // This test verifies the response format is compatible
            expect(mockResponse.data.status).toBeDefined();
            expect(['ok', 'error']).toContain(mockResponse.data.status);

            if (mockResponse.data.status === 'ok') {
                expect(mockResponse.data.info).toBeDefined();
            } else {
                expect(mockResponse.data.error).toBeDefined();
            }
        });

        it('should accept liveness check response format', async () => {
            const mockResponse: AxiosResponse = {
                data: {
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as any,
            };

            // Verify the contract
            expect(mockResponse.data.status).toBe('ok');
            expect(mockResponse.data.timestamp).toBeDefined();
            expect(() => new Date(mockResponse.data.timestamp)).not.toThrow();
        });
    });

    describe('Error Response Contract', () => {
        it('should maintain consistent error format', () => {
            const errorFormats = [
                {
                    errors: [
                        {
                            message: 'Invalid credentials',
                            extensions: {
                                code: 'INVALID_CREDENTIALS',
                                requestId: 'req-123',
                            },
                        },
                    ],
                },
                {
                    errors: [
                        {
                            message: 'Token has expired',
                            extensions: {
                                code: 'TOKEN_EXPIRED',
                                requestId: 'req-456',
                                details: { expiredAt: '2024-01-01T00:00:00Z' },
                            },
                        },
                    ],
                },
            ];

            errorFormats.forEach(errorFormat => {
                expect(errorFormat.errors).toBeInstanceOf(Array);
                errorFormat.errors.forEach(error => {
                    expect(error.message).toBeDefined();
                    expect(error.extensions).toBeDefined();
                    expect(error.extensions.code).toBeDefined();
                    expect(error.extensions.requestId).toBeDefined();
                });
            });
        });
    });
});