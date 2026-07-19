import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CachedUserRepository } from './cached-user.repository';
import type { UserProfileImage } from '../interfaces/user.interface';

@Injectable()
export class LoggingUserRepository extends UserRepository {
  private readonly logger = new Logger(LoggingUserRepository.name);

  constructor(private readonly repo: CachedUserRepository) {
    super();
  }

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

  async create(dto: CreateUserDto) {
    this.logger.log('Creating user');

    return this.repo.create(dto);
  }

  async update(id: number, dto: UpdateUserDto) {
    this.logger.log(`Updating user ${id}`);

    return this.repo.update(id, dto);
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
