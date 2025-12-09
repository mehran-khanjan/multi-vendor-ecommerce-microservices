// src/modules/sessions/sessions.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import { JwtAuthGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users/entities/user.entity';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
class SessionStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  active: number;

  @Field(() => [String])
  devices: string[];
}

@Resolver(() => Session)
@UseGuards(JwtAuthGuard)
export class SessionsResolver {
  constructor(private readonly sessionsService: SessionsService) {}

  @Query(() => [Session], { name: 'mySessions' })
  async getMySessions(@CurrentUser() user: User): Promise<Session[]> {
    return this.sessionsService.findActiveSessions(user.id);
  }

  @Query(() => SessionStats, { name: 'mySessionStats' })
  async getMySessionStats(@CurrentUser() user: User): Promise<SessionStats> {
    return this.sessionsService.getSessionStats(user.id);
  }

  @Mutation(() => Boolean)
  async revokeSession(
    @CurrentUser() user: User,
    @Args('sessionId', { type: () => ID }) sessionId: string,
  ): Promise<boolean> {
    await this.sessionsService.revokeSession(sessionId, user.id);
    return true;
  }

  @Mutation(() => Int)
  async revokeOtherSessions(@CurrentUser() user: User): Promise<number> {
    // The current session ID should be passed from context
    // For now, we revoke all sessions
    return this.sessionsService.revokeAllUserSessions(user.id);
  }
}
