import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private isReady = false;

  constructor(private readonly redisConfig: ConfigService) {
    this.client = new Redis({
      host: this.redisConfig.getOrThrow<string>('redis.host'),
      port: this.redisConfig.getOrThrow<number>('redis.port'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      retryStrategy: () => null,
    });

    this.client.on('error', (error) => {
      this.logger.warn(`Redis unavailable: ${error.message}`);
    });

    this.client.on('ready', () => {
      this.isReady = true;
    });

    this.client.on('close', () => {
      this.isReady = false;
    });

    this.client.on('end', () => {
      this.isReady = false;
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      await this.client.ping();
      this.isReady = true;
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.isReady = false;
      this.logger.warn(
        `Redis is not reachable. Continuing without cache support: ${error}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client.status === 'end') {
      return;
    }

    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  async get(key: string) {
    if (!this.isReady) {
      return null;
    }

    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (!this.isReady) {
      return;
    }

    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
      return;
    }
    await this.client.set(key, value);
  }

  getClient(): Redis {
    return this.client;
  }

  get ready(): boolean {
    return this.isReady;
  }

  async del(key: string) {
    if (!this.isReady) {
      return;
    }

    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    if (!this.isReady) return;

    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length) await this.client.unlink(...keys);
    } while (cursor !== '0');
  }

  async exists(key: string) {
    if (!this.isReady) {
      return false;
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  async acquireLock(
    key: string,
    token: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (!this.isReady) return false;
    const result = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string, token: string): Promise<boolean> {
    if (!this.isReady) return false;

    const result = await this.client.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      key,
      token,
    );
    return result === 1;
  }
}
