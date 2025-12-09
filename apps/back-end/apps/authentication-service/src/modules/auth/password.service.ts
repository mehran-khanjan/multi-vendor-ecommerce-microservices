// src/modules/auth/password.service.ts (continued)
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from './entities/password-reset.entity';
import { UsersRepository } from '@modules/users/users.repository';
import { MailService } from '@modules/mail/mail.service';
import { CryptoUtil, TokenUtil } from '@common/utils';
import { AuthException } from '@common/exceptions';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly tokenExpiryHours: number;
  private readonly resetPasswordUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly usersRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {
    this.tokenExpiryHours = this.configService.get(
      'security.tokenExpiryHours',
      24,
    );
    this.resetPasswordUrl = this.configService.get('frontend.resetPasswordUrl');
  }

  async requestPasswordReset(email: string, ipAddress?: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.debug(
        `Password reset requested for non-existent email: ${email}`,
      );
      return;
    }

    await this.passwordResetRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const token = CryptoUtil.generateToken(32);
    const tokenHash = CryptoUtil.hashToken(token);
    const expiresAt = new Date(
      Date.now() + this.tokenExpiryHours * 60 * 60 * 1000,
    );

    const passwordReset = this.passwordResetRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
    });

    await this.passwordResetRepository.save(passwordReset);

    const resetUrl = `${this.resetPasswordUrl}?token=${token}`;
    await this.mailService.sendPasswordResetEmail(user, resetUrl);

    this.logger.log(`Password reset requested for user ${user.id}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = CryptoUtil.hashToken(token);

    const passwordReset = await this.passwordResetRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!passwordReset) {
      throw new AuthException({
        code: 'RESET_TOKEN_INVALID',
        message: 'Invalid or expired password reset token',
      });
    }

    if (!passwordReset.isValid()) {
      throw new AuthException({
        code: 'RESET_TOKEN_EXPIRED',
        message: 'Password reset token has expired',
      });
    }

    const passwordHash = await CryptoUtil.hashPassword(newPassword);
    await this.usersRepository.updatePassword(
      passwordReset.userId,
      passwordHash,
    );

    passwordReset.isUsed = true;
    passwordReset.usedAt = new Date();
    await this.passwordResetRepository.save(passwordReset);

    await this.usersRepository.resetFailedAttempts(passwordReset.userId);

    this.logger.log(
      `Password reset completed for user ${passwordReset.userId}`,
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findByEmailWithPassword(
      (await this.usersRepository.findById(userId)).email,
    );

    if (!user) {
      throw AuthException.userNotFound();
    }

    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AuthException({
        code: 'PASSWORD_MISMATCH',
        message: 'Current password is incorrect',
      });
    }

    const isSamePassword = await CryptoUtil.comparePassword(
      newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new AuthException({
        code: 'SAME_PASSWORD',
        message: 'New password must be different from current password',
      });
    }

    const passwordHash = await CryptoUtil.hashPassword(newPassword);
    await this.usersRepository.updatePassword(userId, passwordHash);

    this.logger.log(`Password changed for user ${userId}`);
  }

  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const minLength = this.configService.get('security.passwordMinLength', 8);

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&#]/.test(password)) {
      errors.push(
        'Password must contain at least one special character (@$!%*?&#)',
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
