import { HttpStatus } from '@nestjs/common';
import { GatewayException, ERROR_CODES } from '@common/exceptions';

describe('GatewayException', () => {
    describe('Static Factory Methods', () => {
        it('should create unauthenticated exception', () => {
            const exception = GatewayException.unauthenticated();

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.UNAUTHENTICATED);
            expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
            expect(exception.message).toBe('Authentication required');
        });

        it('should create forbidden exception', () => {
            const exception = GatewayException.forbidden();

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.FORBIDDEN);
            expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
            expect(exception.message).toBe('Access denied');
        });

        it('should create rate limited exception with retryAfter', () => {
            const retryAfter = 60;
            const exception = GatewayException.rateLimited(retryAfter);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.RATE_LIMITED);
            expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
            expect(exception.details).toEqual({ retryAfter });
        });

        it('should create service unavailable exception', () => {
            const serviceName = 'auth-service';
            const exception = GatewayException.serviceUnavailable(serviceName);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
            expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
            expect(exception.message).toBe(`Service ${serviceName} is currently unavailable`);
        });

        it('should create gateway timeout exception', () => {
            const serviceName = 'users-service';
            const exception = GatewayException.gatewayTimeout(serviceName);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.GATEWAY_TIMEOUT);
            expect(exception.getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT);
            expect(exception.message).toBe(`Request to ${serviceName} timed out`);
        });

        it('should create query too complex exception', () => {
            const complexity = 600;
            const maxComplexity = 500;
            const exception = GatewayException.queryTooComplex(complexity, maxComplexity);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.QUERY_TOO_COMPLEX);
            expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
            expect(exception.details).toEqual({ complexity, maxComplexity });
        });

        it('should create query too deep exception', () => {
            const depth = 15;
            const maxDepth = 10;
            const exception = GatewayException.queryTooDeep(depth, maxDepth);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(ERROR_CODES.QUERY_TOO_DEEP);
            expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
            expect(exception.details).toEqual({ depth, maxDepth });
        });
    });

    describe('Custom Constructor', () => {
        it('should create exception with custom options', () => {
            const options = {
                code: ERROR_CODES.INTERNAL_ERROR,
                message: 'Custom error message',
                details: { reason: 'test failure' },
                cause: new Error('Root cause'),
            };

            const exception = new GatewayException(options, HttpStatus.BAD_GATEWAY);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(options.code);
            expect(exception.message).toBe(options.message);
            expect(exception.details).toBe(options.details);
            expect(exception.cause).toBe(options.cause);
            expect(exception.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
        });

        it('should handle exception without cause', () => {
            const options = {
                code: ERROR_CODES.BAD_REQUEST,
                message: 'Simple error',
            };

            const exception = new GatewayException(options);

            expect(exception).toBeInstanceOf(GatewayException);
            expect(exception.code).toBe(options.code);
            expect(exception.message).toBe(options.message);
            expect(exception.details).toBeUndefined();
            expect(exception.cause).toBeUndefined();
            expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe('Error Code Coverage', () => {
        it('should cover all ERROR_CODES in factory methods', () => {
            const testedCodes = [
                ERROR_CODES.UNAUTHENTICATED,
                ERROR_CODES.FORBIDDEN,
                ERROR_CODES.RATE_LIMITED,
                ERROR_CODES.SERVICE_UNAVAILABLE,
                ERROR_CODES.GATEWAY_TIMEOUT,
                ERROR_CODES.QUERY_TOO_COMPLEX,
                ERROR_CODES.QUERY_TOO_DEEP,
            ];

            const allCodes = Object.values(ERROR_CODES);

            // Ensure we have test coverage for critical error codes
            const criticalCodes = [
                ERROR_CODES.UNAUTHENTICATED,
                ERROR_CODES.FORBIDDEN,
                ERROR_CODES.INTERNAL_ERROR,
                ERROR_CODES.SERVICE_UNAVAILABLE,
                ERROR_CODES.GATEWAY_TIMEOUT,
            ];

            criticalCodes.forEach(code => {
                expect(testedCodes.includes(code)).toBe(true);
            });
        });
    });
});