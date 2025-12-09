// src/modules/sessions/sessions.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session } from './entities/session.entity';
import { TokenUtil } from '@common/utils';
import { AuthException } from '@common/exceptions';
import * as UAParser from 'ua-parser-js';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly sessionDuration: string;

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) {
    this.sessionDuration = this.configService.get(
      'jwt.refreshExpiration',
      '7d',
    );
  }

  async createSession(
    userId: string,
    metadata?: { userAgent?: string; ipAddress?: string },
  ): Promise<Session> {
    const sessionId = TokenUtil.generateSessionId();
    const expiresAt = TokenUtil.calculateExpiration(this.sessionDuration);

    // Parse user agent
    let device: string | undefined;
    let browser: string | undefined;
    let os: string | undefined;

    if (metadata?.userAgent) {
      const parser = new UAParser(metadata.userAgent);
      const result = parser.getResult();
      device = result.device.model || result.device.type || 'Desktop';
      browser = result.browser.name
        ? `${result.browser.name} ${result.browser.version}`
        : undefined;
      os = result.os.name
        ? `${result.os.name} ${result.os.version}`
        : undefined;
    }

    const session = this.sessionRepository.create({
      userId,
      sessionId,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      device,
      browser,
      os,
      lastActiveAt: new Date(),
      expiresAt,
    });

    await this.sessionRepository.save(session);

    this.logger.log(`Session created for user ${userId}: ${sessionId}`);

    return session;
  }

  async findBySessionId(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { sessionId },
      relations: ['user'],
    });
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isRevoked: false },
      order: { lastActiveAt: 'DESC' },
    });
  }

  async findActiveSessions(userId: string): Promise<Session[]> {
    const sessions = await this.findUserSessions(userId);
    return sessions.filter((session) => session.isActive());
  }

  async updateLastActive(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { sessionId },
      { lastActiveAt: new Date() },
    );
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId, userId },
    });

    if (!session) {
      throw new AuthException({
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    this.logger.log(`Session revoked: ${sessionId}`);
  }

  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('is_revoked = false');

    if (exceptSessionId) {
      query.andWhere('session_id != :exceptSessionId', { exceptSessionId });
    }

    const result = await query.execute();

    this.logger.log(`Revoked ${result.affected} sessions for user ${userId}`);

    return result.affected || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired sessions`);

    return result.affected || 0;
  }

  async getSessionStats(userId: string): Promise<{
    total: number;
    active: number;
    devices: string[];
  }> {
    const sessions = await this.findUserSessions(userId);
    const activeSessions = sessions.filter((s) => s.isActive());
    const devices = [
      ...new Set(activeSessions.map((s) => s.device).filter(Boolean)),
    ];

    return {
      total: sessions.length,
      active: activeSessions.length,
      devices,
    };
  }
}
