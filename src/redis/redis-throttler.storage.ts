import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const countKey = `throttler:${key}:${throttlerName}:count`;
    const blockedKey = `throttler:${key}:${throttlerName}:blocked`;

    if (!this.redisService.ready) {
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const client = this.redisService.getClient();

    const blockedTTL = await client.pttl(blockedKey);
    if (blockedTTL > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(blockedTTL / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedTTL / 1000),
      };
    }

    const [[, totalHits], [, pttl]] = (await client
      .multi()
      .incr(countKey)
      .pttl(countKey)
      .exec()) as [[null, number], [null, number]];

    let timeToExpire = pttl;

    if (totalHits === 1 || timeToExpire < 0) {
      await client.pexpire(countKey, ttl);
      timeToExpire = ttl;
    }

    let isBlocked = false;
    let timeToBlockExpire = 0;

    if (totalHits > limit) {
      isBlocked = true;
      await client.set(blockedKey, '1', 'PX', blockDuration);
      timeToBlockExpire = blockDuration;
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(Math.max(0, timeToExpire) / 1000),
      isBlocked,
      timeToBlockExpire: Math.ceil(timeToBlockExpire / 1000),
    };
  }
}
