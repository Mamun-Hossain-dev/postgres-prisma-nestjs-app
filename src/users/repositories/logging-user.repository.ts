import { Injectable, Logger } from '@nestjs/common';
import type { UserRepository } from './user.repository';
import { CachedUserRepository } from './cached-user.repository';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserProfileImage,
} from '../interfaces/user.interface';

@Injectable()
export class LoggingUserRepository implements UserRepository {
  private readonly logger = new Logger(LoggingUserRepository.name);

  constructor(private readonly repo: CachedUserRepository) {}

  async findByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);

    try {
      const result = await this.repo.findByEmail(email);

      this.logger.log('User fetched successfully');

      return result;
    } catch (error) {
      this.logger.error(error);

      throw error;
    }
  }

  async create(input: CreateUserInput) {
    this.logger.log('Creating user');

    return this.repo.create(input);
  }

  async update(id: number, input: UpdateUserInput) {
    this.logger.log(`Updating user ${id}`);

    return this.repo.update(id, input);
  }

  async setBlocked(id: number, isBlocked: boolean) {
    this.logger.log(`${isBlocked ? 'Blocking' : 'Unblocking'} user ${id}`);

    return this.repo.setBlocked(id, isBlocked);
  }

  async updateProfileImage(id: number, image: UserProfileImage | null) {
    this.logger.log(
      `${image ? 'Updating' : 'Removing'} user ${id} profile image`,
    );

    return this.repo.updateProfileImage(id, image);
  }

  async delete(id: number) {
    this.logger.log(`Deleting user ${id}`);

    return this.repo.delete(id);
  }

  async findById(id: number) {
    return this.repo.findById(id);
  }

  async findAll() {
    return this.repo.findAll();
  }
}
