// src/modules/auth/auth.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { User, UserStatus } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { UsersRepository } from '@modules/users/users.repository';
import { SessionsService } from '@modules/sessions/sessions.service';
import { MailService } from '@modules/mail/mail.service';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { TwoFactorService } from './two-factor.service';
import { EmailVerification } from './entities/email-verification.entity';

import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  TwoFactorResponse,
  TwoFactorSetupResponse,
  MessageResponse,
} from './dto';

import { CryptoUtil, TokenUtil } from '@common/utils';
import { AuthException } from '@common/exceptions';
import { JwtPayload } from '@common/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts: number;
  private readonly lockoutDuration: number;
  private readonly verifyEmailUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly twoFactorService: TwoFactorService,
    private readonly mailService: MailService,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.maxLoginAttempts = this.configService.get(
      'security.maxLoginAttempts',
      5,
    );
    this.lockoutDuration = this.configService.get(
      'security.lockoutDuration',
      15,
    );
    this.verifyEmailUrl = this.configService.get('frontend.verifyEmailUrl');
  }

  // ==================== Registration ====================

  async register(
    input: RegisterInput,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(
      input.password,
    );
    if (!passwordValidation.valid) {
      throw AuthException.passwordTooWeak();
    }

    // Create user
    const user = await this.usersService.create({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
    });

    // Send verification email
    await this.sendVerificationEmail(user);

    // Create session and generate tokens
    const session = await this.sessionsService.createSession(user.id, metadata);
    const tokens = await this.tokenService.generateTokens(
      user,
      session.id,
      metadata,
    );

    this.logger.log(`User registered: ${user.id} (${user.email})`);

    return {
      ...tokens,
      user,
    };
  }

  // ==================== Login ====================

  async login(
    input: LoginInput,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse | TwoFactorResponse> {
    const user = await this.usersRepository.findByEmailWithPassword(
      input.email,
    );

    if (!user) {
      throw AuthException.invalidCredentials();
    }

    // Check account status
    await this.checkAccountStatus(user);

    // Check if account is locked
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw AuthException.accountLocked(minutesRemaining);
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(input.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw AuthException.invalidCredentials();
    }

    // Reset failed attempts on successful password
    await this.usersRepository.resetFailedAttempts(user.id);

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!input.twoFactorCode && !input.backupCode) {
        // Generate temporary token for 2FA step
        const tempToken = await this.generateTempToken(user.id);
        return {
          requiresTwoFactor: true,
          tempToken,
        };
      }

      // Verify 2FA code
      let isValid = false;
      if (input.twoFactorCode) {
        isValid = await this.twoFactorService.verify(
          user.id,
          input.twoFactorCode,
        );
      } else if (input.backupCode) {
        isValid = await this.twoFactorService.verifyBackupCode(
          user.id,
          input.backupCode,
        );
      }

      if (!isValid) {
        throw AuthException.twoFactorInvalid();
      }
    }

    // Create session and generate tokens
    const session = await this.sessionsService.createSession(user.id, metadata);
    const tokens = await this.tokenService.generateTokens(
      user,
      session.id,
      metadata,
    );

    // Update login info
    await this.usersRepository.updateLoginInfo(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: metadata?.ipAddress,
    });

    this.logger.log(`User logged in: ${user.id} (${user.email})`);

    // Fetch fresh user data
    const freshUser = await this.usersService.findById(user.id);

    return {
      ...tokens,
      user: freshUser,
    };
  }

  async completeTwoFactorLogin(
    tempToken: string,
    code: string,
    isBackupCode: boolean = false,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const userId = await this.verifyTempToken(tempToken);

    if (!userId) {
      throw AuthException.tokenInvalid();
    }

    const user = await this.usersService.findById(userId);

    // Verify code
    let isValid = false;
    if (isBackupCode) {
      isValid = await this.twoFactorService.verifyBackupCode(userId, code);
    } else {
      isValid = await this.twoFactorService.verify(userId, code);
    }

    if (!isValid) {
      throw AuthException.twoFactorInvalid();
    }

    // Invalidate temp token
    await this.cacheManager.del(`2fa_temp:${tempToken}`);

    // Create session and generate tokens
    const session = await this.sessionsService.createSession(user.id, metadata);
    const tokens = await this.tokenService.generateTokens(
      user,
      session.id,
      metadata,
    );

    // Update login info
    await this.usersRepository.updateLoginInfo(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: metadata?.ipAddress,
    });

    this.logger.log(`User completed 2FA login: ${user.id}`);

    return {
      ...tokens,
      user,
    };
  }

  // ==================== Logout ====================

  async logout(sessionId: string, userId: string): Promise<boolean> {
    await this.tokenService.revokeSessionTokens(sessionId);
    await this.sessionsService.revokeSession(sessionId, userId);

    this.logger.log(`User logged out: ${userId}, session: ${sessionId}`);

    return true;
  }

  async logoutAllDevices(userId: string): Promise<boolean> {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.sessionsService.revokeAllUserSessions(userId);

    this.logger.log(`All sessions logged out for user: ${userId}`);

    return true;
  }

  // ==================== Token Refresh ====================

  async refreshToken(
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const result = await this.tokenService.refreshAccessToken(
      refreshToken,
      metadata,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  // ==================== Token Validation ====================

  async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      const user = await this.usersService.findById(payload.sub);

      return { valid: true, user };
    } catch (error) {
      return { valid: false };
    }
  }

  // ==================== Email Verification ====================

  async sendVerificationEmail(user: User): Promise<void> {
    // Invalidate previous tokens
    await this.emailVerificationRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const token = CryptoUtil.generateToken(32);
    const tokenHash = CryptoUtil.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verification = this.emailVerificationRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.emailVerificationRepository.save(verification);

    const verifyUrl = `${this.verifyEmailUrl}?token=${token}`;
    await this.mailService.sendVerificationEmail(user, verifyUrl);

    this.logger.log(`Verification email sent to user ${user.id}`);
  }

  async verifyEmail(token: string): Promise<MessageResponse> {
    const tokenHash = CryptoUtil.hashToken(token);

    const verification = await this.emailVerificationRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!verification) {
      throw new AuthException({
        code: 'VERIFICATION_TOKEN_INVALID',
        message: 'Invalid verification token',
      });
    }

    if (!verification.isValid()) {
      throw new AuthException({
        code: 'VERIFICATION_TOKEN_EXPIRED',
        message: 'Verification token has expired',
      });
    }

    if (verification.user.emailVerified) {
      throw new AuthException({
        code: 'ALREADY_VERIFIED',
        message: 'Email is already verified',
      });
    }

    // Mark as verified
    await this.usersRepository.verifyEmail(verification.userId);

    // Mark token as used
    verification.isUsed = true;
    verification.usedAt = new Date();
    await this.emailVerificationRepository.save(verification);

    this.logger.log(`Email verified for user ${verification.userId}`);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendVerificationEmail(userId: string): Promise<MessageResponse> {
    const user = await this.usersService.findById(userId);

    if (user.emailVerified) {
      throw new AuthException({
        code: 'ALREADY_VERIFIED',
        message: 'Email is already verified',
      });
    }

    await this.sendVerificationEmail(user);

    return {
      success: true,
      message: 'Verification email sent',
    };
  }

  // ==================== Password Management ====================

  async forgotPassword(
    email: string,
    ipAddress?: string,
  ): Promise<MessageResponse> {
    await this.passwordService.requestPasswordReset(email, ipAddress);

    return {
      success: true,
      message:
        'If an account exists with this email, a password reset link has been sent',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<MessageResponse> {
    const passwordValidation =
      this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw AuthException.passwordTooWeak();
    }

    await this.passwordService.resetPassword(token, newPassword);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<MessageResponse> {
    const passwordValidation =
      this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw AuthException.passwordTooWeak();
    }

    await this.passwordService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    // Optionally revoke all other sessions
    // await this.logoutAllDevices(userId);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // ==================== Two-Factor Authentication ====================

  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.usersService.findById(userId);
    return this.twoFactorService.generateSecret(userId, user.email);
  }

  async enableTwoFactor(
    userId: string,
    code: string,
  ): Promise<MessageResponse> {
    await this.twoFactorService.verifyAndEnable(userId, code);

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully',
    };
  }

  async disableTwoFactor(
    userId: string,
    code: string,
    password: string,
  ): Promise<MessageResponse> {
    await this.twoFactorService.disable(userId, code, password);

    return {
      success: true,
      message: 'Two-factor authentication disabled successfully',
    };
  }

  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    return this.twoFactorService.regenerateBackupCodes(userId, code);
  }

  // ==================== Helper Methods ====================

  private async checkAccountStatus(user: User): Promise<void> {
    switch (user.status) {
      case UserStatus.PENDING:
        throw AuthException.accountNotVerified();
      case UserStatus.SUSPENDED:
        throw AuthException.accountSuspended();
      case UserStatus.BANNED:
        throw new AuthException({
          code: 'ACCOUNT_BANNED',
          message: 'Your account has been banned',
        });
    }
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const attempts = await this.usersRepository.incrementFailedAttempts(
      user.id,
    );

    if (attempts >= this.maxLoginAttempts) {
      const lockUntil = new Date(Date.now() + this.lockoutDuration * 60 * 1000);
      await this.usersRepository.lockAccount(user.id, lockUntil);

      this.logger.warn(`Account locked due to failed attempts: ${user.id}`);
    }
  }

  private async generateTempToken(userId: string): Promise<string> {
    const token = CryptoUtil.generateToken(32);
    await this.cacheManager.set(`2fa_temp:${token}`, userId, 5 * 60 * 1000); // 5 minutes
    return token;
  }

  private async verifyTempToken(token: string): Promise<string | null> {
    return this.cacheManager.get<string>(`2fa_temp:${token}`);
  }
}
