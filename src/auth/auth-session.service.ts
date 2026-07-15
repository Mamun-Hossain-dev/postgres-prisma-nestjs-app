import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { AppException } from '../common/exceptions/app.exception';
import type { SessionMetadata } from './interfaces/auth.interface';

interface StoredSession {
  userId: number;
  hashedRefreshToken: string;
  device: string;
  ip: string;
  userAgent: string;
  expiresAt: string;
}

export interface RefreshSessionResult {
  userId: number;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthSessionService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = configService.getOrThrow<number>(
      'auth.refreshTokenTtlSeconds',
    );
  }

  async create(
    userId: number,
    metadata: SessionMetadata,
  ): Promise<RefreshSessionResult> {
    this.assertRedisReady();

    const sessionId = randomUUID();
    const secret = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const session: StoredSession = {
      userId,
      hashedRefreshToken: this.hash(secret),
      ...metadata,
      expiresAt: expiresAt.toISOString(),
    };
    const client = this.redis.getClient();

    await client
      .multi()
      .set(
        this.sessionKey(sessionId),
        JSON.stringify(session),
        'EX',
        this.ttlSeconds,
      )
      .sadd(this.userSessionsKey(userId), sessionId)
      .expire(this.userSessionsKey(userId), this.ttlSeconds)
      .exec();

    return {
      userId,
      refreshToken: this.serializeToken(sessionId, secret),
      expiresAt,
    };
  }

  async rotate(
    refreshToken: string,
    metadata: SessionMetadata,
  ): Promise<RefreshSessionResult> {
    this.assertRedisReady();
    const { sessionId, secret } = this.parseToken(refreshToken);
    const sessionKey = this.sessionKey(sessionId);
    const rawSession = await this.redis.get(sessionKey);

    if (!rawSession) {
      throw this.invalidRefreshToken();
    }

    const session = this.parseSession(rawSession);
    if (session.hashedRefreshToken !== this.hash(secret)) {
      await this.revokeBySessionId(sessionId, session.userId);
      throw this.invalidRefreshToken();
    }

    const newSecret = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const rotatedSession: StoredSession = {
      ...session,
      hashedRefreshToken: this.hash(newSecret),
      ...metadata,
      expiresAt: expiresAt.toISOString(),
    };

    const rotationResult = await this.redis.getClient().eval(
      `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
       redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
       redis.call('SADD', KEYS[2], ARGV[4])
       redis.call('EXPIRE', KEYS[2], ARGV[3])
       return 1`,
      2,
      sessionKey,
      this.userSessionsKey(session.userId),
      rawSession,
      JSON.stringify(rotatedSession),
      String(this.ttlSeconds),
      sessionId,
    );

    if (rotationResult !== 1) {
      await this.revokeBySessionId(sessionId, session.userId);
      throw this.invalidRefreshToken();
    }

    return {
      userId: session.userId,
      refreshToken: this.serializeToken(sessionId, newSecret),
      expiresAt,
    };
  }

  async revoke(refreshToken: string): Promise<void> {
    const parsed = this.tryParseToken(refreshToken);
    if (!parsed || !this.redis.ready) return;

    const rawSession = await this.redis.get(this.sessionKey(parsed.sessionId));
    if (!rawSession) return;

    const session = this.parseSession(rawSession);
    if (session.hashedRefreshToken !== this.hash(parsed.secret)) return;

    await this.revokeBySessionId(parsed.sessionId, session.userId);
  }

  private async revokeBySessionId(sessionId: string, userId: number) {
    await this.redis
      .getClient()
      .multi()
      .del(this.sessionKey(sessionId))
      .srem(this.userSessionsKey(userId), sessionId)
      .exec();
  }

  private parseToken(token: string) {
    const parsed = this.tryParseToken(token);
    if (!parsed) throw this.invalidRefreshToken();
    return parsed;
  }

  private tryParseToken(token: string) {
    const [sessionId, secret, extra] = token.split('.');
    if (extra || !sessionId || !secret) return null;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(sessionId) || !uuidPattern.test(secret)) return null;
    return { sessionId, secret };
  }

  private parseSession(rawSession: string): StoredSession {
    try {
      return JSON.parse(rawSession) as StoredSession;
    } catch {
      throw this.invalidRefreshToken();
    }
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private serializeToken(sessionId: string, secret: string) {
    return `${sessionId}.${secret}`;
  }

  private sessionKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  private userSessionsKey(userId: number) {
    return `user:${userId}:sessions`;
  }

  private assertRedisReady() {
    if (!this.redis.ready) {
      throw new AppException(
        'Authentication sessions are temporarily unavailable',
        {
          code: 'AUTH_SESSION_UNAVAILABLE',
          status: 503,
        },
      );
    }
  }

  private invalidRefreshToken() {
    return new AppException('Invalid or expired refresh token', {
      code: 'INVALID_REFRESH_TOKEN',
      status: 401,
    });
  }
}
