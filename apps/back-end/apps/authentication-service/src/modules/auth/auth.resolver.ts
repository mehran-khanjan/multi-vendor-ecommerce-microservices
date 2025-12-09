// src/modules/auth/auth.resolver.ts
import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@modules/users/entities/user.entity';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  VerifyEmailInput,
  VerifyTwoFactorInput,
  DisableTwoFactorInput,
  AuthResponse,
  TwoFactorResponse,
  TwoFactorSetupResponse,
  MessageResponse,
} from './dto';
import { JwtAuthGuard } from '@common/guards';
import { CurrentUser, Public } from '@common/decorators';
import { RequestContext } from '@common/interfaces';
import { Field, ObjectType, createUnionType } from '@nestjs/graphql';

// Union type for login response
const LoginResult = createUnionType({
  name: 'LoginResult',
  types: () => [AuthResponse, TwoFactorResponse] as const,
  resolveType(value) {
    if ('requiresTwoFactor' in value) {
      return TwoFactorResponse;
    }
    return AuthResponse;
  },
});

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // ==================== Public Mutations ====================

  @Public()
  @Mutation(() => AuthResponse)
  async register(
    @Args('input') input: RegisterInput,
    @Context() context: RequestContext,
  ): Promise<AuthResponse> {
    const metadata = {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
    };

    return this.authService.register(input, metadata);
  }

  @Public()
  @Mutation(() => LoginResult)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: RequestContext,
  ): Promise<typeof LoginResult> {
    const metadata = {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
    };

    return this.authService.login(input, metadata);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async completeTwoFactorLogin(
    @Args('tempToken') tempToken: string,
    @Args('code') code: string,
    @Args('isBackupCode', { nullable: true, defaultValue: false })
    isBackupCode: boolean,
    @Context() context: RequestContext,
  ): Promise<AuthResponse> {
    const metadata = {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
    };

    return this.authService.completeTwoFactorLogin(
      tempToken,
      code,
      isBackupCode,
      metadata,
    );
  }

  @Public()
  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
    @Context() context: RequestContext,
  ): Promise<AuthResponse> {
    const metadata = {
      userAgent: context.req.headers['user-agent'],
      ipAddress: context.req.ip,
    };

    return this.authService.refreshToken(input.refreshToken, metadata);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async forgotPassword(
    @Args('input') input: ForgotPasswordInput,
    @Context() context: RequestContext,
  ): Promise<MessageResponse> {
    return this.authService.forgotPassword(input.email, context.req.ip);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<MessageResponse> {
    return this.authService.resetPassword(input.token, input.newPassword);
  }

  @Public()
  @Mutation(() => MessageResponse)
  async verifyEmail(
    @Args('input') input: VerifyEmailInput,
  ): Promise<MessageResponse> {
    return this.authService.verifyEmail(input.token);
  }

  // ==================== Protected Mutations ====================

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async logout(
    @CurrentUser() user: User,
    @Context() context: RequestContext,
  ): Promise<boolean> {
    const sessionId = context.req['sessionId'];
    return this.authService.logout(sessionId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async logoutAllDevices(@CurrentUser() user: User): Promise<boolean> {
    return this.authService.logoutAllDevices(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') input: ChangePasswordInput,
  ): Promise<MessageResponse> {
    return this.authService.changePassword(
      user.id,
      input.currentPassword,
      input.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async resendVerificationEmail(
    @CurrentUser() user: User,
  ): Promise<MessageResponse> {
    return this.authService.resendVerificationEmail(user.id);
  }

  // ==================== Two-Factor Authentication ====================

  @UseGuards(JwtAuthGuard)
  @Mutation(() => TwoFactorSetupResponse)
  async setupTwoFactor(
    @CurrentUser() user: User,
  ): Promise<TwoFactorSetupResponse> {
    return this.authService.setupTwoFactor(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async enableTwoFactor(
    @CurrentUser() user: User,
    @Args('input') input: VerifyTwoFactorInput,
  ): Promise<MessageResponse> {
    return this.authService.enableTwoFactor(user.id, input.code);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async disableTwoFactor(
    @CurrentUser() user: User,
    @Args('input') input: DisableTwoFactorInput,
  ): Promise<MessageResponse> {
    return this.authService.disableTwoFactor(
      user.id,
      input.code,
      input.password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [String])
  async regenerateBackupCodes(
    @CurrentUser() user: User,
    @Args('code') code: string,
  ): Promise<string[]> {
    return this.authService.regenerateBackupCodes(user.id, code);
  }

  // ==================== Queries ====================

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
