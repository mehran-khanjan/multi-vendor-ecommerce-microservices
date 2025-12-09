import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RequestContextMiddleware } from '@common/middleware/request-context.middleware';
import { DomainDetector } from '@common/utils';
import { OriginDomain } from '@common/enums';

// Mocks
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

jest.mock('@common/utils', () => ({
    DomainDetector: jest.fn(() => ({
        detect: jest.fn(),
    })),
}));

describe('RequestContextMiddleware', () => {
    let middleware: RequestContextMiddleware;
    let configService: ConfigService;
    let domainDetector: DomainDetector;

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockReq = {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
    } as Request;

    const mockRes = {
        setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RequestContextMiddleware,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        middleware = module.get<RequestContextMiddleware>(RequestContextMiddleware);
        configService = module.get<ConfigService>(ConfigService);
        domainDetector = (middleware as any).domainDetector;

        jest.clearAllMocks();

        // Default mock implementations
        (domainDetector.detect as jest.Mock).mockReturnValue(OriginDomain.CUSTOMER);
        mockConfigService.get.mockImplementation((key: string) => {
            switch (key) {
                case 'auth.jwt.secret':
                    return 'test-secret';
                case 'auth.jwt.issuer':
                    return 'test-issuer';
                case 'auth.jwt.audience':
                    return 'test-audience';
                case 'cors.customerOrigins':
                    return ['http://localhost:3000'];
                case 'cors.vendorOrigins':
                    return ['http://localhost:3001'];
                case 'cors.adminOrigins':
                    return ['http://localhost:3002'];
                default:
                    return null;
            }
        });
    });

    describe('use', () => {
        it('should create context with request ID from headers', () => {
            const requestId = 'existing-request-id';
            mockReq.headers['x-request-id'] = requestId;
            mockReq.headers['x-correlation-id'] = 'existing-correlation-id';

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context).toBeDefined();
            expect(mockReq.context.requestId).toBe(requestId);
            expect(mockReq.context.correlationId).toBe('existing-correlation-id');
            expect(mockReq.context.originDomain).toBe(OriginDomain.CUSTOMER);
            expect(mockReq.context.isAuthenticated).toBe(false);
            expect(next).toHaveBeenCalled();
        });

        it('should generate new IDs when not in headers', () => {
            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.requestId).toBeDefined();
            expect(mockReq.context.correlationId).toBeDefined();
            expect(mockReq.context.requestId).toBe(mockReq.context.correlationId);
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-request-id', mockReq.context.requestId);
            expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', mockReq.context.correlationId);
        });

        it('should extract authenticated user from valid token', () => {
            const jwt = require('jsonwebtoken');
            const tokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                email_verified: true,
                roles: ['customer'],
                permissions: ['user:read:own'],
                tenant_id: 'tenant-123',
                vendor_id: 'vendor-123',
                iat: Date.now() / 1000,
                exp: Date.now() / 1000 + 3600,
            };

            (jwt.verify as jest.Mock).mockReturnValue(tokenPayload);
            mockReq.headers.authorization = 'Bearer valid-token';

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.user).toEqual({
                id: tokenPayload.sub,
                email: tokenPayload.email,
                emailVerified: tokenPayload.email_verified,
                roles: tokenPayload.roles,
                permissions: tokenPayload.permissions,
                tenantId: tokenPayload.tenant_id,
                vendorId: tokenPayload.vendor_id,
                iat: tokenPayload.iat,
                exp: tokenPayload.exp,
            });
            expect(mockReq.context.isAuthenticated).toBe(true);
        });

        it('should handle invalid token gracefully', () => {
            const jwt = require('jsonwebtoken');
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });
            mockReq.headers.authorization = 'Bearer invalid-token';

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.user).toBeNull();
            expect(mockReq.context.isAuthenticated).toBe(false);
        });

        it('should extract client IP from forwarded headers', () => {
            const forwardedIp = '192.168.1.100';
            mockReq.headers['x-forwarded-for'] = `${forwardedIp}, 10.0.0.1`;

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.clientIp).toBe(forwardedIp);
        });

        it('should extract client IP from x-real-ip header', () => {
            const realIp = '192.168.1.200';
            mockReq.headers['x-real-ip'] = realIp;

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.clientIp).toBe(realIp);
        });

        it('should fall back to request IP', () => {
            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.clientIp).toBe('127.0.0.1');
        });

        it('should detect unknown domain when no matches', () => {
            (domainDetector.detect as jest.Mock).mockReturnValue(OriginDomain.UNKNOWN);

            middleware.use(mockReq, mockRes, next);

            expect(mockReq.context.originDomain).toBe(OriginDomain.UNKNOWN);
        });
    });

    describe('extractUser', () => {
        it('should return null for missing authorization header', () => {
            const result = (middleware as any).extractUser(mockReq);
            expect(result).toBeNull();
        });

        it('should return null for non-bearer token', () => {
            mockReq.headers.authorization = 'Basic dXNlcjpwYXNz';
            const result = (middleware as any).extractUser(mockReq);
            expect(result).toBeNull();
        });

        it('should return null for malformed authorization header', () => {
            mockReq.headers.authorization = 'Bearer';
            const result = (middleware as any).extractUser(mockReq);
            expect(result).toBeNull();
        });
    });

    describe('getClientIp', () => {
        it('should prioritize x-forwarded-for', () => {
            mockReq.headers['x-forwarded-for'] = '192.168.1.100, 10.0.0.1';
            mockReq.headers['x-real-ip'] = '192.168.1.200';
            mockReq.ip = '127.0.0.1';

            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('192.168.1.100');
        });

        it('should handle multiple IPs in x-forwarded-for', () => {
            mockReq.headers['x-forwarded-for'] = ' 192.168.1.100 , 10.0.0.1 , 172.16.0.1 ';
            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('192.168.1.100');
        });

        it('should fall back to x-real-ip', () => {
            mockReq.headers['x-real-ip'] = '192.168.1.200';
            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('192.168.1.200');
        });

        it('should fall back to req.ip', () => {
            mockReq.ip = '127.0.0.1';
            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('127.0.0.1');
        });

        it('should fall back to socket remoteAddress', () => {
            mockReq.ip = undefined;
            mockReq.socket.remoteAddress = '192.168.1.50';
            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('192.168.1.50');
        });

        it('should return unknown when no IP found', () => {
            mockReq.ip = undefined;
            mockReq.socket.remoteAddress = undefined;
            const result = (middleware as any).getClientIp(mockReq);
            expect(result).toBe('unknown');
        });
    });
});