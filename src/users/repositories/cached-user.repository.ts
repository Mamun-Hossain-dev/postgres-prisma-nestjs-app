import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class CachedUserRepository extends UserRepository {
  constructor(
    private readonly redis: RedisService,
    private readonly repository: UserRepository,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:${email}`;
    const cacheUser = await this.redis.get(cacheKey);
    if (cacheUser) {
      console.log('Cache hit!');
      return JSON.parse(cacheUser) as User;
    }

    const user = await this.repository.findByEmail(email);
    if (user) {
      await this.redis.set(cacheKey, JSON.stringify(user), 60 * 5); // Cache for 1 hour
    }
    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = await this.repository.create(data);
    await this.redis.del(`user:${user.email}`); // Invalidate cache
    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User | null> {
    const user = await this.repository.update(id, data);
    if (user) {
      await this.redis.del(`user:${user.email}`);
    }
    return user;
  }

  async delete(id: number): Promise<void> {
    return this.repository.delete(id);
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.repository.findAll();
  }
}
