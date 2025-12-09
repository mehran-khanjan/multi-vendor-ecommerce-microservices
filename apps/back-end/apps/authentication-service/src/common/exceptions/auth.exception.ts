// src/common/exceptions/auth.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_CODES } from '@common/constants';

export interface AuthExceptionOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

export class AuthException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    options: AuthExceptionOptions,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        code: options.code,
        message: options.message,
        details: options.details,
      },
      status,
    );
    this.code = options.code;
    this.details = options.details;
  }

  // Factory methods
  static invalidCredentials(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static accountLocked(minutesRemaining?: number): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.ACCOUNT_LOCKED,
        message:
          'Account is temporarily locked due to too many failed login attempts',
        details: minutesRemaining ? { minutesRemaining } : undefined,
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static accountNotVerified(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.ACCOUNT_NOT_VERIFIED,
        message: 'Please verify your email address before logging in',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static accountSuspended(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.ACCOUNT_SUSPENDED,
        message: 'Your account has been suspended',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static tokenExpired(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Token has expired',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static tokenInvalid(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'Invalid token',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static refreshTokenExpired(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        message: 'Refresh token has expired',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static twoFactorRequired(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.TWO_FACTOR_REQUIRED,
        message: 'Two-factor authentication is required',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static twoFactorInvalid(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.TWO_FACTOR_INVALID,
        message: 'Invalid two-factor authentication code',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static userNotFound(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found',
      },
      HttpStatus.NOT_FOUND,
    );
  }

  static emailAlreadyExists(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'An account with this email already exists',
      },
      HttpStatus.CONFLICT,
    );
  }

  static passwordTooWeak(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.PASSWORD_TOO_WEAK,
        message: 'Password does not meet security requirements',
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  static unauthorized(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication required',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(message = 'Access denied'): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.FORBIDDEN,
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static insufficientPermissions(): AuthException {
    return new AuthException(
      {
        code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        message: 'Insufficient permissions to perform this action',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
