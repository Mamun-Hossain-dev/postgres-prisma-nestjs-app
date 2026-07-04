import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly redisConfig: ConfigService) {
    this.client = new Redis({
      host: this.redisConfig.getOrThrow<string>('redis.host'),
      port: this.redisConfig.getOrThrow<number>('redis.port'),
    });
  }

  async onModuleInit() {
    await this.client.ping();
    console.log('Redis connected successfully');
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('Redis connection closed');
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
      return;
    }
    await this.client.set(key, value);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async exists(key: string) {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
