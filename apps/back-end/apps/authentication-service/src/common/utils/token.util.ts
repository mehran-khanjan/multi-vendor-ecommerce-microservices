// src/common/utils/token.util.ts
import { v4 as uuidv4 } from 'uuid';

export class TokenUtil {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return uuidv4();
  }

  /**
   * Generate a unique token with prefix
   */
  static generatePrefixedToken(prefix: string): string {
    return `${prefix}_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Parse expiration time string to milliseconds
   */
  static parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  /**
   * Calculate expiration date
   */
  static calculateExpiration(duration: string): Date {
    const ms = this.parseExpiration(duration);
    return new Date(Date.now() + ms);
  }
}
