// src/modules/auth/two-factor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { UsersRepository } from '@modules/users/users.repository';
import { CryptoUtil } from '@common/utils';
import { AuthException } from '@common/exceptions';
import { TwoFactorSetupResponse } from './dto';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly appName: string;
  private readonly issuer: string;
  private readonly backupCodesCount = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    this.appName = this.configService.get(
      'twoFactor.appName',
      'MultiVendorApp',
    );
    this.issuer = this.configService.get(
      'twoFactor.issuer',
      'multi-vendor-app',
    );
  }

  async generateSecret(
    userId: string,
    email: string,
  ): Promise<TwoFactorSetupResponse> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw AuthException.userNotFound();
    }

    if (user.twoFactorEnabled) {
      throw new AuthException({
        code: 'TWO_FACTOR_ALREADY_ENABLED',
        message: 'Two-factor authentication is already enabled',
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.appName}:${email}`,
      issuer: this.issuer,
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((code) =>
      CryptoUtil.hashToken(code),
    );

    // Save secret temporarily (not enabled yet)
    await this.usersRepository.updateTwoFactor(userId, {
      twoFactorSecret: secret.base32,
      twoFactorBackupCodes: hashedBackupCodes,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    this.logger.log(`2FA secret generated for user ${userId}`);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  async verifyAndEnable(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw AuthException.userNotFound();
    }

    if (user.twoFactorEnabled) {
      throw new AuthException({
        code: 'TWO_FACTOR_ALREADY_ENABLED',
        message: 'Two-factor authentication is already enabled',
      });
    }

    if (!user.twoFactorSecret) {
      throw new AuthException({
        code: 'TWO_FACTOR_NOT_SETUP',
        message: 'Two-factor authentication has not been set up',
      });
    }

    const isValid = this.verifyToken(user.twoFactorSecret, code);

    if (!isValid) {
      throw AuthException.twoFactorInvalid();
    }

    await this.usersRepository.updateTwoFactor(userId, {
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date(),
    });

    this.logger.log(`2FA enabled for user ${userId}`);

    return true;
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw AuthException.userNotFound();
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AuthException({
        code: 'TWO_FACTOR_NOT_ENABLED',
        message: 'Two-factor authentication is not enabled',
      });
    }

    return this.verifyToken(user.twoFactorSecret, code);
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw AuthException.userNotFound();
    }

    if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
      return false;
    }

    const hashedCode = CryptoUtil.hashToken(code);
    const codeIndex = user.twoFactorBackupCodes.findIndex(
      (storedHash) => storedHash === hashedCode,
    );

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    const updatedCodes = [...user.twoFactorBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await this.usersRepository.updateTwoFactor(userId, {
      twoFactorBackupCodes: updatedCodes,
    });

    this.logger.log(
      `Backup code used for user ${userId}. Remaining: ${updatedCodes.length}`,
    );

    return true;
  }

  async disable(
    userId: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.usersRepository.findByEmailWithPassword(
      (await this.usersRepository.findById(userId)).email,
    );

    if (!user) {
      throw AuthException.userNotFound();
    }

    // Verify password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw AuthException.invalidCredentials();
    }

    // Verify 2FA code
    const isCodeValid = await this.verify(userId, code);
    if (!isCodeValid) {
      throw AuthException.twoFactorInvalid();
    }

    await this.usersRepository.updateTwoFactor(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorVerifiedAt: null,
    });

    this.logger.log(`2FA disabled for user ${userId}`);

    return true;
  }

  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    const isValid = await this.verify(userId, code);

    if (!isValid) {
      throw AuthException.twoFactorInvalid();
    }

    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map((c) => CryptoUtil.hashToken(c));

    await this.usersRepository.updateTwoFactor(userId, {
      twoFactorBackupCodes: hashedBackupCodes,
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);

    return backupCodes;
  }

  private verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step tolerance (30 seconds before/after)
    });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.backupCodesCount; i++) {
      codes.push(CryptoUtil.generateSecureRandom(8).toUpperCase());
    }
    return codes;
  }
}
