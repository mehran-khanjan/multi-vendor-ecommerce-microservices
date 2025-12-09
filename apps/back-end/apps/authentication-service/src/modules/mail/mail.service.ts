// src/modules/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('frontend.url');
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Multi Vendor App!',
        template: 'welcome',
        context: {
          name: user.firstName,
          loginUrl: `${this.frontendUrl}/login`,
        },
      });

      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${user.email}`, error);
    }
  }

  async sendVerificationEmail(user: User, verifyUrl: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Verify Your Email Address',
        template: 'verify-email',
        context: {
          name: user.firstName,
          verifyUrl,
          expiresIn: '24 hours',
        },
      });

      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error,
      );
    }
  }

  async sendPasswordResetEmail(user: User, resetUrl: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset Your Password',
        template: 'reset-password',
        context: {
          name: user.firstName,
          resetUrl,
          expiresIn: '24 hours',
        },
      });

      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        error,
      );
    }
  }

  async sendTwoFactorBackupCodesEmail(
    user: User,
    backupCodes: string[],
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your Two-Factor Authentication Backup Codes',
        template: 'two-factor',
        context: {
          name: user.firstName,
          backupCodes,
        },
      });

      this.logger.log(`2FA backup codes email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send 2FA backup codes email to ${user.email}`,
        error,
      );
    }
  }

  async sendLoginNotificationEmail(
    user: User,
    metadata: { device?: string; location?: string; time: Date },
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'New Login to Your Account',
        template: 'login-notification',
        context: {
          name: user.firstName,
          device: metadata.device || 'Unknown device',
          location: metadata.location || 'Unknown location',
          time: metadata.time.toISOString(),
          securityUrl: `${this.frontendUrl}/account/security`,
        },
      });

      this.logger.log(`Login notification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send login notification to ${user.email}`,
        error,
      );
    }
  }
}
