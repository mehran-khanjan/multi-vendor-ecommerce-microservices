import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';

// Mock TypeORM to avoid database connection
jest.mock('@nestjs/typeorm', () => ({
    ...jest.requireActual('@nestjs/typeorm'),
    TypeOrmModule: {
        forRoot: jest.fn(() => ({})),
        forRootAsync: jest.fn(() => ({})),
        forFeature: jest.fn(() => ({})),
    },
}));

// Mock data factories
export const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    status: 'active',
    twoFactorEnabled: false,
    roles: [{ name: 'customer', permissions: [{ slug: 'user:read:own' }] }],
    profile: {
        userId: 'user-123',
        timezone: 'UTC',
        language: 'en',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockJwtPayload = (overrides = {}) => ({
    sub: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    roles: ['customer'],
    permissions: ['user:read:own'],
    sessionId: 'session-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
});

export const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        execute: jest.fn(),
    })),
};

export const createTestingModule = async (providers: any[], entities: any[] = []) => {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                load: [
                    () => ({
                        app: {
                            nodeEnv: 'test',
                            port: 4001,
                        },
                        database: {
                            host: 'localhost',
                            port: 5432,
                            username: 'test',
                            password: 'test',
                            database: 'auth_test',
                            synchronize: false,
                            logging: false,
                        },
                        jwt: {
                            secret: 'test-jwt-secret-very-long-for-testing-purposes',
                            accessExpiration: '15m',
                            refreshExpiration: '7d',
                            issuer: 'auth-service-test',
                            audience: 'multi-vendor-app-test',
                        },
                        security: {
                            bcryptRounds: 4, // Faster for tests
                            passwordMinLength: 8,
                            maxLoginAttempts: 3,
                            lockoutDuration: 1, // 1 minute for tests
                            tokenExpiryHours: 24,
                        },
                        frontend: {
                            url: 'http://localhost:3000',
                            verifyEmailUrl: 'http://localhost:3000/verify-email',
                            resetPasswordUrl: 'http://localhost:3000/reset-password',
                        },
                    }),
                ],
            }),
            JwtModule.register({
                secret: 'test-secret',
                signOptions: {
                    expiresIn: '15m',
                    issuer: 'test-issuer',
                    audience: 'test-audience',
                },
            }),
            PassportModule.register({ defaultStrategy: 'jwt' }),
            CacheModule.register({
                isGlobal: true,
                store: 'memory',
                ttl: 300,
            }),
            TypeOrmModule.forFeature(entities),
        ],
        providers,
    }).compile();

    return moduleRef;
};