import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '@modules/app/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { User } from '@modules/users/entities/user.entity';
import { UserProfile } from '@modules/users/entities/user-profile.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { Permission } from '@modules/roles/entities/permission.entity';
import { RefreshToken } from '@modules/auth/entities/refresh-token.entity';

// Test database configuration
const testConfig = {
    app: {
        nodeEnv: 'test',
        port: 4001,
    },
    database: {
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
        dropSchema: true,
    },
    jwt: {
        secret: 'test-jwt-secret-very-long-string-for-testing-purposes',
        accessExpiration: '15m',
        refreshExpiration: '7d',
        issuer: 'auth-service-test',
        audience: 'multi-vendor-app-test',
    },
    security: {
        bcryptRounds: 4,
        passwordMinLength: 8,
        maxLoginAttempts: 3,
        lockoutDuration: 1,
        tokenExpiryHours: 24,
    },
    frontend: {
        url: 'http://localhost:3000',
        verifyEmailUrl: 'http://localhost:3000/verify-email',
        resetPasswordUrl: 'http://localhost:3000/reset-password',
    },
    mail: {
        host: 'smtp.test.com',
        port: 587,
        user: 'test',
        password: 'test',
        from: 'test@test.com',
    },
};

describe('Auth Flow Integration', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let roleRepository: Repository<Role>;
    let permissionRepository: Repository<Permission>;
    let refreshTokenRepository: Repository<RefreshToken>;
    let configService: ConfigService;

    let testUser: User;
    let testRole: Role;
    let authToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    load: [() => testConfig],
                }),
                AppModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Get repositories
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
        roleRepository = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
        permissionRepository = moduleFixture.get<Repository<Permission>>(getRepositoryToken(Permission));
        refreshTokenRepository = moduleFixture.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
        configService = moduleFixture.get<ConfigService>(ConfigService);

        await app.init();

        // Create test data
        await setupTestData();
    });

    afterAll(async () => {
        await app.close();
    });

    async function setupTestData() {
        // Create permission
        const permission = permissionRepository.create({
            resource: 'user',
            action: 'read',
            scope: 'own',
            slug: 'user:read:own',
            description: 'Read own user profile',
        });
        await permissionRepository.save(permission);

        // Create customer role
        testRole = roleRepository.create({
            name: 'customer',
            displayName: 'Customer',
            description: 'Regular customer',
            type: 'system',
            isDefault: true,
            permissions: [permission],
        });
        await roleRepository.save(testRole);
    }

    describe('User Registration Flow', () => {
        it('should register a new user', async () => {
            const registerInput = {
                email: 'newuser@example.com',
                password: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
                phoneNumber: '+12345678901',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                accessToken
                refreshToken
                expiresIn
                user {
                  id
                  email
                  firstName
                  lastName
                  emailVerified
                }
              }
            }
          `,
                    variables: { input: registerInput },
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.register.accessToken).toBeDefined();
            expect(data.register.refreshToken).toBeDefined();
            expect(data.register.user.email).toBe(registerInput.email);
            expect(data.register.user.emailVerified).toBe(false);

            // Store for later tests
            authToken = data.register.accessToken;
            refreshToken = data.register.refreshToken;
            testUser = await userRepository.findOne({
                where: { email: registerInput.email },
                relations: ['roles'],
            });
        });

        it('should prevent duplicate email registration', async () => {
            const registerInput = {
                email: 'newuser@example.com', // Already registered
                password: 'AnotherPass123!',
                firstName: 'Duplicate',
                lastName: 'User',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                accessToken
                user { id }
              }
            }
          `,
                    variables: { input: registerInput },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('EMAIL_ALREADY_EXISTS');
        });

        it('should validate password strength', async () => {
            const weakPasswordInput = {
                email: 'weakpass@example.com',
                password: 'weak', // Too weak
                firstName: 'Weak',
                lastName: 'Password',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                accessToken
              }
            }
          `,
                    variables: { input: weakPasswordInput },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('PASSWORD_TOO_WEAK');
        });
    });

    describe('User Login Flow', () => {
        it('should login with valid credentials', async () => {
            const loginInput = {
                email: 'newuser@example.com',
                password: 'SecurePass123!',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on AuthResponse {
                  accessToken
                  refreshToken
                  expiresIn
                  user {
                    id
                    email
                  }
                }
              }
            }
          `,
                    variables: { input: loginInput },
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.login.accessToken).toBeDefined();
            expect(data.login.refreshToken).toBeDefined();
            expect(data.login.user.email).toBe(loginInput.email);

            // Update tokens
            authToken = data.login.accessToken;
            refreshToken = data.login.refreshToken;
        });

        it('should reject login with invalid credentials', async () => {
            const loginInput = {
                email: 'newuser@example.com',
                password: 'WrongPassword123!',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on AuthResponse {
                  accessToken
                }
              }
            }
          `,
                    variables: { input: loginInput },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('INVALID_CREDENTIALS');
        });

        it('should lock account after multiple failed attempts', async () => {
            const loginInput = {
                email: 'newuser@example.com',
                password: 'WrongPassword123!',
            };

            // Make multiple failed attempts
            for (let i = 0; i < 3; i++) {
                await request(app.getHttpServer())
                    .post('/graphql')
                    .send({
                        query: `
              mutation Login($input: LoginInput!) {
                login(input: $input) {
                  ... on AuthResponse {
                    accessToken
                  }
                }
              }
            `,
                        variables: { input: loginInput },
                    });
            }

            // Next attempt should be locked
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on AuthResponse {
                  accessToken
                }
              }
            }
          `,
                    variables: { input: loginInput },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('ACCOUNT_LOCKED');
        });
    });

    describe('Token Management Flow', () => {
        it('should refresh access token', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation RefreshToken($input: RefreshTokenInput!) {
              refreshToken(input: $input) {
                accessToken
                refreshToken
                expiresIn
                user {
                  id
                  email
                }
              }
            }
          `,
                    variables: { input: { refreshToken } },
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.refreshToken.accessToken).toBeDefined();
            expect(data.refreshToken.refreshToken).toBeDefined();
            expect(data.refreshToken.user.email).toBe('newuser@example.com');

            // Update tokens
            authToken = data.refreshToken.accessToken;
            refreshToken = data.refreshToken.refreshToken;
        });

        it('should reject invalid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation RefreshToken($input: RefreshTokenInput!) {
              refreshToken(input: $input) {
                accessToken
              }
            }
          `,
                    variables: { input: { refreshToken: 'invalid-token' } },
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('TOKEN_INVALID');
        });
    });

    describe('Protected Routes', () => {
        it('should access protected route with valid token', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query Me {
              me {
                id
                email
                firstName
                lastName
                roles {
                  name
                }
              }
            }
          `,
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.me.email).toBe('newuser@example.com');
            expect(data.me.roles[0].name).toBe('customer');
        });

        it('should reject access without token', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            query Me {
              me {
                id
                email
              }
            }
          `,
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('UNAUTHORIZED');
        });

        it('should reject access with expired token', async () => {
            // Create an expired token
            const jwt = require('jsonwebtoken');
            const expiredToken = jwt.sign(
                { sub: testUser.id, email: testUser.email, sessionId: 'expired-session' },
                configService.get('jwt.secret'),
                { expiresIn: '-1h', issuer: configService.get('jwt.issuer') }
            );

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${expiredToken}`)
                .send({
                    query: `
            query Me {
              me {
                id
                email
              }
            }
          `,
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('TOKEN_EXPIRED');
        });
    });

    describe('Logout Flow', () => {
        it('should logout successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            mutation Logout {
              logout
            }
          `,
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.logout).toBe(true);
        });

        it('should reject requests with logged out token', async () => {
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    query: `
            query Me {
              me {
                id
                email
              }
            }
          `,
                })
                .expect(200);

            expect(response.body.errors).toBeDefined();
            expect(response.body.errors[0].extensions.code).toBe('UNAUTHORIZED');
        });
    });

    describe('Profile Management', () => {
        it('should update user profile', async () => {
            // First get a new token
            const loginResponse = await request(app.getHttpServer())
                .post('/graphql')
                .send({
                    query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                ... on AuthResponse {
                  accessToken
                  user { id }
                }
              }
            }
          `,
                    variables: {
                        input: {
                            email: 'newuser@example.com',
                            password: 'SecurePass123!',
                        }
                    },
                })
                .expect(200);

            const newToken = loginResponse.body.data.login.accessToken;

            const updateInput = {
                birthdate: '1990-01-01',
                gender: 'male',
                bio: 'Test bio',
                website: 'https://example.com',
                timezone: 'America/New_York',
                language: 'en',
                currency: 'USD',
            };

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('Authorization', `Bearer ${newToken}`)
                .send({
                    query: `
            mutation UpdateProfile($input: UpdateProfileInput!) {
              updateProfile(input: $input) {
                id
                birthdate
                gender
                bio
                website
                timezone
                language
                currency
              }
            }
          `,
                    variables: { input: updateInput },
                })
                .expect(200);

            const { data, errors } = response.body;

            expect(errors).toBeUndefined();
            expect(data.updateProfile.bio).toBe(updateInput.bio);
            expect(data.updateProfile.timezone).toBe(updateInput.timezone);
        });
    });
});