import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { AuthService } from '@modules/auth/auth.service';
import { UsersService } from '@modules/users/users.service';
import { UsersRepository } from '@modules/users/users.repository';
import { SessionsService } from '@modules/sessions/sessions.service';
import { TokenService } from '@modules/auth/token.service';
import { PasswordService } from '@modules/auth/password.service';
import { TwoFactorService } from '@modules/auth/two-factor.service';
import { MailService } from '@modules/mail/mail.service';
import { AuthException } from '@common/exceptions';
import { User, UserStatus } from '@modules/users/entities/user.entity';
import { EmailVerification } from '@modules/auth/entities/email-verification.entity';
import { createMockUser, mockRepository, createTestingModule } from '../../../jest.setup';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let usersRepository: UsersRepository;
    let sessionsService: SessionsService;
    let tokenService: TokenService;
    let passwordService: PasswordService;
    let twoFactorService: TwoFactorService;
    let mailService: MailService;
    let cacheManager: any;
    let emailVerificationRepository: Repository<EmailVerification>;

    const mockUsersService = {
        create: jest.fn(),
        findById: jest.fn(),
    };

    const mockUsersRepository = {
        findByEmailWithPassword: jest.fn(),
        resetFailedAttempts: jest.fn(),
        incrementFailedAttempts: jest.fn(),
        lockAccount: jest.fn(),
        updateLoginInfo: jest.fn(),
        verifyEmail: jest.fn(),
        updateTwoFactor: jest.fn(),
    };

    const mockSessionsService = {
        createSession: jest.fn(),
        revokeSession: jest.fn(),
        revokeAllUserSessions: jest.fn(),
    };

    const mockTokenService = {
        generateTokens: jest.fn(),
        refreshAccessToken: jest.fn(),
        revokeSessionTokens: jest.fn(),
        revokeAllUserTokens: jest.fn(),
    };

    const mockPasswordService = {
        validatePasswordStrength: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPassword: jest.fn(),
        changePassword: jest.fn(),
    };

    const mockTwoFactorService = {
        verify: jest.fn(),
        verifyBackupCode: jest.fn(),
        generateSecret: jest.fn(),
        verifyAndEnable: jest.fn(),
        disable: jest.fn(),
        regenerateBackupCodes: jest.fn(),
    };

    const mockMailService = {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
        sendTwoFactorBackupCodesEmail: jest.fn(),
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockEmailVerificationRepository = {
        ...mockRepository,
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: UsersRepository, useValue: mockUsersRepository },
                { provide: SessionsService, useValue: mockSessionsService },
                { provide: TokenService, useValue: mockTokenService },
                { provide: PasswordService, useValue: mockPasswordService },
                { provide: TwoFactorService, useValue: mockTwoFactorService },
                { provide: MailService, useValue: mockMailService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
                {
                    provide: 'EmailVerificationRepository',
                    useValue: mockEmailVerificationRepository
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            switch (key) {
                                case 'security.maxLoginAttempts':
                                    return 3;
                                case 'security.lockoutDuration':
                                    return 15;
                                case 'frontend.verifyEmailUrl':
                                    return 'http://localhost:3000/verify-email';
                                default:
                                    return null;
                            }
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        usersRepository = module.get<UsersRepository>(UsersRepository);
        sessionsService = module.get<SessionsService>(SessionsService);
        tokenService = module.get<TokenService>(TokenService);
        passwordService = module.get<PasswordService>(PasswordService);
        twoFactorService = module.get<TwoFactorService>(TwoFactorService);
        mailService = module.get<MailService>(MailService);
        cacheManager = module.get(CACHE_MANAGER);
        emailVerificationRepository = module.get('EmailVerificationRepository');

        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerInput = {
            email: 'test@example.com',
            password: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            phoneNumber: '+1234567890',
        };

        const metadata = {
            userAgent: 'Test-Agent',
            ipAddress: '127.0.0.1',
        };

        const mockUser = createMockUser();

        it('should successfully register a new user', async () => {
            mockPasswordService.validatePasswordStrength.mockReturnValue({ valid: true });
            mockUsersService.create.mockResolvedValue(mockUser);
            mockSessionsService.createSession.mockResolvedValue({ id: 'session-123' });
            mockTokenService.generateTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            });

            const result = await service.register(registerInput, metadata);

            expect(result.user).toEqual(mockUser);
            expect(result.accessToken).toBe('access-token');
            expect(mockPasswordService.validatePasswordStrength).toHaveBeenCalledWith(
                registerInput.password
            );
            expect(mockUsersService.create).toHaveBeenCalledWith({
                email: registerInput.email,
                password: registerInput.password,
                firstName: registerInput.firstName,
                lastName: registerInput.lastName,
                phoneNumber: registerInput.phoneNumber,
            });
            expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
        });

        it('should throw exception for weak password', async () => {
            mockPasswordService.validatePasswordStrength.mockReturnValue({
                valid: false,
                errors: ['Password too weak']
            });

            await expect(service.register(registerInput, metadata))
                .rejects.toThrow(AuthException);
            await expect(service.register(registerInput, metadata))
                .rejects.toThrow('Password does not meet security requirements');
        });
    });

    describe('login', () => {
        const loginInput = {
            email: 'test@example.com',
            password: 'Password123!',
        };

        const metadata = {
            userAgent: 'Test-Agent',
            ipAddress: '127.0.0.1',
        };

        const mockUser = {
            ...createMockUser(),
            validatePassword: jest.fn(),
            isLocked: jest.fn(),
        };

        beforeEach(() => {
            mockUser.validatePassword.mockReset();
            mockUser.isLocked.mockReset();
        });

        it('should successfully login with valid credentials', async () => {
            mockUsersRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
            mockUser.isLocked.mockReturnValue(false);
            mockUser.validatePassword.mockResolvedValue(true);
            mockSessionsService.createSession.mockResolvedValue({ id: 'session-123' });
            mockTokenService.generateTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            });
            mockUsersService.findById.mockResolvedValue(mockUser);

            const result = await service.login(loginInput, metadata);

            expect(result).toHaveProperty('accessToken');
            expect(mockUsersRepository.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
            expect(mockUsersRepository.updateLoginInfo).toHaveBeenCalledWith(mockUser.id, {
                lastLoginAt: expect.any(Date),
                lastLoginIp: metadata.ipAddress,
            });
        });

        it('should throw exception for invalid credentials', async () => {
            mockUsersRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
            mockUser.isLocked.mockReturnValue(false);
            mockUser.validatePassword.mockResolvedValue(false);
            mockUsersRepository.incrementFailedAttempts.mockResolvedValue(1);

            await expect(service.login(loginInput, metadata))
                .rejects.toThrow(AuthException);
            await expect(service.login(loginInput, metadata))
                .rejects.toThrow('Invalid email or password');
        });

        it('should throw exception for locked account', async () => {
            mockUsersRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
            mockUser.isLocked.mockReturnValue(true);
            mockUser.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

            await expect(service.login(loginInput, metadata))
                .rejects.toThrow(AuthException);
            await expect(service.login(loginInput, metadata))
                .rejects.toThrow('Account is temporarily locked');
        });

        it('should require two-factor authentication when enabled', async () => {
            const twoFactorUser = {
                ...createMockUser(),
                twoFactorEnabled: true,
                validatePassword: jest.fn().mockResolvedValue(true),
                isLocked: jest.fn().mockReturnValue(false),
            };

            mockUsersRepository.findByEmailWithPassword.mockResolvedValue(twoFactorUser);
            mockCacheManager.set.mockResolvedValue(undefined);

            const result = await service.login(loginInput, metadata);

            expect(result).toHaveProperty('requiresTwoFactor', true);
            expect(result).toHaveProperty('tempToken');
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should complete two-factor login with valid code', async () => {
            const tempToken = 'temp-token-123';
            const code = '123456';
            const userId = 'user-123';
            const mockUser = createMockUser();

            mockCacheManager.get.mockResolvedValue(userId);
            mockUsersService.findById.mockResolvedValue(mockUser);
            mockTwoFactorService.verify.mockResolvedValue(true);
            mockSessionsService.createSession.mockResolvedValue({ id: 'session-123' });
            mockTokenService.generateTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            });

            const result = await service.completeTwoFactorLogin(
                tempToken,
                code,
                false,
                metadata
            );

            expect(result.accessToken).toBe('access-token');
            expect(mockCacheManager.del).toHaveBeenCalledWith(`2fa_temp:${tempToken}`);
        });

        it('should handle invalid temp token', async () => {
            mockCacheManager.get.mockResolvedValue(null);

            await expect(
                service.completeTwoFactorLogin('invalid-token', '123456', false, metadata)
            ).rejects.toThrow(AuthException);
        });
    });

    describe('checkAccountStatus', () => {
        it('should allow active users', async () => {
            const user = createMockUser({ status: UserStatus.ACTIVE });

            // Should not throw
            await expect((service as any).checkAccountStatus(user)).resolves.toBeUndefined();
        });

        it('should throw for pending users', async () => {
            const user = createMockUser({ status: UserStatus.PENDING });

            await expect((service as any).checkAccountStatus(user))
                .rejects.toThrow(AuthException);
            await expect((service as any).checkAccountStatus(user))
                .rejects.toThrow('Please verify your email address');
        });

        it('should throw for suspended users', async () => {
            const user = createMockUser({ status: UserStatus.SUSPENDED });

            await expect((service as any).checkAccountStatus(user))
                .rejects.toThrow(AuthException);
            await expect((service as any).checkAccountStatus(user))
                .rejects.toThrow('Your account has been suspended');
        });
    });

    describe('logout', () => {
        it('should successfully logout user', async () => {
            const sessionId = 'session-123';
            const userId = 'user-123';

            const result = await service.logout(sessionId, userId);

            expect(result).toBe(true);
            expect(mockTokenService.revokeSessionTokens).toHaveBeenCalledWith(sessionId);
            expect(mockSessionsService.revokeSession).toHaveBeenCalledWith(sessionId, userId);
        });

        it('should logout all devices', async () => {
            const userId = 'user-123';

            const result = await service.logoutAllDevices(userId);

            expect(result).toBe(true);
            expect(mockTokenService.revokeAllUserTokens).toHaveBeenCalledWith(userId);
            expect(mockSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(userId);
        });
    });

    describe('email verification', () => {
        it('should send verification email', async () => {
            const user = createMockUser();
            const mockVerification = {
                userId: user.id,
                tokenHash: 'hashed-token',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };

            mockEmailVerificationRepository.update.mockResolvedValue({});
            mockEmailVerificationRepository.create.mockReturnValue(mockVerification);
            mockEmailVerificationRepository.save.mockResolvedValue(mockVerification);

            await (service as any).sendVerificationEmail(user);

            expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
                user,
                expect.stringContaining('verify-email')
            );
        });

        it('should verify email with valid token', async () => {
            const token = 'valid-token';
            const tokenHash = 'hashed-token';
            const userId = 'user-123';
            const mockVerification = {
                userId,
                tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
                isValid: () => true,
                user: { emailVerified: false },
            };

            jest.spyOn(require('@common/utils'), 'CryptoUtil').hashToken.mockReturnValue(tokenHash);
            mockEmailVerificationRepository.findOne.mockResolvedValue(mockVerification);

            const result = await service.verifyEmail(token);

            expect(result.success).toBe(true);
            expect(mockUsersRepository.verifyEmail).toHaveBeenCalledWith(userId);
        });
    });

    describe('password management', () => {
        it('should handle forgot password', async () => {
            const email = 'test@example.com';
            const ipAddress = '127.0.0.1';

            const result = await service.forgotPassword(email, ipAddress);

            expect(result.success).toBe(true);
            expect(mockPasswordService.requestPasswordReset).toHaveBeenCalledWith(email, ipAddress);
        });

        it('should change password', async () => {
            const userId = 'user-123';
            const currentPassword = 'OldPassword123!';
            const newPassword = 'NewPassword123!';

            const result = await service.changePassword(userId, currentPassword, newPassword);

            expect(result.success).toBe(true);
            expect(mockPasswordService.changePassword).toHaveBeenCalledWith(
                userId,
                currentPassword,
                newPassword
            );
        });
    });

    describe('two-factor authentication', () => {
        it('should setup two-factor authentication', async () => {
            const userId = 'user-123';
            const mockResponse = {
                secret: 'test-secret',
                qrCodeUrl: 'data:image/png;base64,...',
                backupCodes: ['CODE1', 'CODE2'],
            };

            mockTwoFactorService.generateSecret.mockResolvedValue(mockResponse);

            const result = await service.setupTwoFactor(userId);

            expect(result).toEqual(mockResponse);
        });

        it('should enable two-factor with valid code', async () => {
            const userId = 'user-123';
            const code = '123456';

            const result = await service.enableTwoFactor(userId, code);

            expect(result.success).toBe(true);
            expect(mockTwoFactorService.verifyAndEnable).toHaveBeenCalledWith(userId, code);
        });
    });
});