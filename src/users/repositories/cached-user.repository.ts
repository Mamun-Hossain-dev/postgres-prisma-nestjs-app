import { Injectable } from '@nestjs/common';

import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User, UserProfileImage } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CachedUserRepository extends UserRepository {
  private readonly cacheTtlInSeconds = 60 * 5;

  constructor(
    private readonly redis: RedisService,
    private readonly repository: UserRepository,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = this.getEmailCacheKey(email);
    const cacheUser = await this.redis.get(cacheKey);

    if (cacheUser) {
      console.log('Cache hit!');
      return JSON.parse(cacheUser) as User;
    }

    const user = await this.repository.findByEmail(email);

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = await this.repository.create(data);

    await this.cacheUser(user);

    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User | null> {
    const existingUser = await this.repository.findById(id);
    const user = await this.repository.update(id, data);

    if (!user) {
      return null;
    }

    if (existingUser) {
      await this.invalidateUserCache(existingUser);
    }

    await this.cacheUser(user);

    return user;
  }

  async setBlocked(id: number, isBlocked: boolean): Promise<User | null> {
    const existingUser = await this.repository.findById(id);
    const user = await this.repository.setBlocked(id, isBlocked);

    if (!user) {
      return null;
    }

    if (existingUser) {
      await this.invalidateUserCache(existingUser);
    }

    await this.cacheUser(user);
    return user;
  }

  async updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null> {
    const existingUser = await this.repository.findById(id);
    const user = await this.repository.updateProfileImage(id, image);

    if (!user) return null;

    if (existingUser) await this.invalidateUserCache(existingUser);
    await this.cacheUser(user);

    return user;
  }

  async delete(id: number): Promise<void> {
    const existingUser = await this.repository.findById(id);

    await this.repository.delete(id);

    if (existingUser) {
      await this.invalidateUserCache(existingUser);
    }
  }

  async findById(id: number): Promise<User | null> {
    const cacheKey = this.getIdCacheKey(id);
    const cacheUser = await this.redis.get(cacheKey);

    if (cacheUser) {
      console.log('Cache hit!');
      return JSON.parse(cacheUser) as User;
    }

    const user = await this.repository.findById(id);

    if (user) {
      await this.cacheUser(user);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.repository.findAll();
  }

  private async cacheUser(user: User): Promise<void> {
    const serializedUser = JSON.stringify(user);

    await Promise.all([
      this.redis.set(
        this.getIdCacheKey(user.id),
        serializedUser,
        this.cacheTtlInSeconds,
      ),
      this.redis.set(
        this.getEmailCacheKey(user.email),
        serializedUser,
        this.cacheTtlInSeconds,
      ),
    ]);
  }

  private async invalidateUserCache(user: User): Promise<void> {
    await Promise.all([
      this.redis.del(this.getIdCacheKey(user.id)),
      this.redis.del(this.getEmailCacheKey(user.email)),
    ]);
  }

  private getIdCacheKey(id: number): string {
    return `user:id:${id}`;
  }

  private getEmailCacheKey(email: string): string {
    return `user:email:${email}`;
  }
}
