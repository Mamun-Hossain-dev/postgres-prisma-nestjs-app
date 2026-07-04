import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class LoggingUserRepository extends UserRepository {
  private readonly logger = new Logger(LoggingUserRepository.name);

  constructor(private readonly repository: UserRepository) {
    super();
  }

  async findByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);

    try {
      const result = await this.repository.findByEmail(email);

      this.logger.log('User fetched successfully');

      return result;
    } catch (error) {
      this.logger.error(error);

      throw error;
    }
  }

  async create(dto: CreateUserDto) {
    this.logger.log('Creating user');

    return this.repository.create(dto);
  }

  async update(id: number, dto: UpdateUserDto) {
    this.logger.log(`Updating user ${id}`);

    return this.repository.update(id, dto);
  }

  async delete(id: number) {
    this.logger.log(`Deleting user ${id}`);

    return this.repository.delete(id);
  }

  async findById(id: number) {
    return this.repository.findById(id);
  }

  async findAll() {
    return this.repository.findAll();
  }
}
