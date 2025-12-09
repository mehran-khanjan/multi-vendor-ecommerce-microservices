import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@common/guards/auth.guard';
import { GatewayException } from '@common/exceptions';
import { OperationParser } from '@common/utils';

// Mocks
jest.mock('@nestjs/graphql', () => ({
    GqlExecutionContext: {
        create: jest.fn(),
    },
}));

jest.mock('@common/utils', () => ({
    OperationParser: {
        parse: jest.fn(),
    },
}));

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let reflector: Reflector;
    let configService: ConfigService;

    const mockReflector = {
        getAllAndOverride: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const mockGqlContext = {
        getContext: jest.fn(),
        getInfo: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthGuard,
                { provide: Reflector, useValue: mockReflector },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        guard = module.get<AuthGuard>(AuthGuard);
        reflector = module.get<Reflector>(Reflector);
        configService = module.get<ConfigService>(ConfigService);

        jest.clearAllMocks();
        (GqlExecutionContext.create as jest.Mock).mockReturnValue(mockGqlContext);
    });

    describe('canActivate', () => {
        it('should allow access for public routes via decorator', () => {
            mockReflector.getAllAndOverride.mockReturnValue(true);

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
                mockContext.getHandler(),
                mockContext.getClass(),
            ]);
        });

        it('should allow access for public operations from config', () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);
            mockConfigService.get.mockReturnValue(['Login', 'Register']);

            mockGqlContext.getContext.mockReturnValue({
                req: { body: { operationName: 'Login' } },
            });

            mockGqlContext.getInfo.mockReturnValue({
                operation: { name: { value: 'Login' } },
            });

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('should throw unauthenticated exception when no user context', () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);
            mockConfigService.get.mockReturnValue([]);

            mockGqlContext.getContext.mockReturnValue({
                req: {
                    body: { operationName: 'PrivateOperation' },
                    context: { isAuthenticated: false },
                },
            });

            mockGqlContext.getInfo.mockReturnValue({
                operation: { name: { value: 'PrivateOperation' } },
            });

            expect(() => guard.canActivate(mockContext)).toThrow(GatewayException);
            expect(() => guard.canActivate(mockContext)).toThrow('Authentication required');
        });

        it('should allow access for authenticated users', () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);
            mockConfigService.get.mockReturnValue([]);

            const now = Math.floor(Date.now() / 1000);
            mockGqlContext.getContext.mockReturnValue({
                req: {
                    body: { operationName: 'PrivateOperation' },
                    context: {
                        isAuthenticated: true,
                        user: { id: 'user-123', exp: now + 3600 },
                    },
                },
            });

            mockGqlContext.getInfo.mockReturnValue({
                operation: { name: { value: 'PrivateOperation' } },
            });

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
        });

        it('should throw token expired exception when token expired', () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);
            mockConfigService.get.mockReturnValue([]);

            const now = Math.floor(Date.now() / 1000);
            mockGqlContext.getContext.mockReturnValue({
                req: {
                    body: { operationName: 'PrivateOperation' },
                    context: {
                        isAuthenticated: true,
                        user: { id: 'user-123', exp: now - 3600 }, // Expired
                    },
                },
            });

            mockGqlContext.getInfo.mockReturnValue({
                operation: { name: { value: 'PrivateOperation' } },
            });

            expect(() => guard.canActivate(mockContext)).toThrow(GatewayException);
            expect(() => guard.canActivate(mockContext)).toThrow('Token has expired');
        });

        it('should extract operation name from body when not in info', () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);
            mockConfigService.get.mockReturnValue(['Login']);

            mockGqlContext.getContext.mockReturnValue({
                req: {
                    body: { operationName: 'Login', query: 'query Login { __typename }' },
                    context: { isAuthenticated: false },
                },
            });

            mockGqlContext.getInfo.mockReturnValue({
                operation: null, // No operation in info
            });

            (OperationParser.parse as jest.Mock).mockReturnValue({
                name: 'Login',
                type: 'query',
                fields: [],
                depth: 1,
                aliasCount: 0,
            });

            const result = guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(OperationParser.parse).toHaveBeenCalledWith(
                'query Login { __typename }',
                'Login'
            );
        });
    });

    describe('isPublicOperation', () => {
        it('should return true for public operations', () => {
            mockConfigService.get.mockReturnValue(['Login', 'Register']);

            const result = (guard as any).isPublicOperation('Login');

            expect(result).toBe(true);
        });

        it('should return false for private operations', () => {
            mockConfigService.get.mockReturnValue(['Login', 'Register']);

            const result = (guard as any).isPublicOperation('PrivateOperation');

            expect(result).toBe(false);
        });

        it('should handle empty public operations list', () => {
            mockConfigService.get.mockReturnValue([]);

            const result = (guard as any).isPublicOperation('Login');

            expect(result).toBe(false);
        });
    });

    describe('extractOperationName', () => {
        it('should extract from body operationName', () => {
            const req = { body: { operationName: 'TestOperation' } };

            const result = (guard as any).extractOperationName(req);

            expect(result).toBe('TestOperation');
        });

        it('should parse from query when no operationName', () => {
            const req = {
                body: {
                    query: 'query TestOperation { __typename }',
                    operationName: null,
                },
            };

            (OperationParser.parse as jest.Mock).mockReturnValue({
                name: 'TestOperation',
                type: 'query',
                fields: [],
                depth: 1,
                aliasCount: 0,
            });

            const result = (guard as any).extractOperationName(req);

            expect(result).toBe('TestOperation');
            expect(OperationParser.parse).toHaveBeenCalledWith(
                'query TestOperation { __typename }',
                null
            );
        });

        it('should return null for invalid body', () => {
            const req = { body: null };

            const result = (guard as any).extractOperationName(req);

            expect(result).toBeNull();
        });

        it('should handle parsing errors gracefully', () => {
            const req = {
                body: {
                    query: 'invalid graphql query',
                },
            };

            (OperationParser.parse as jest.Mock).mockImplementation(() => {
                throw new Error('Parse error');
            });

            const result = (guard as any).extractOperationName(req);

            expect(result).toBeNull();
        });
    });
});