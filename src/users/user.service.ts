import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser, Role } from './interfaces/user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser } from './utils/public-user.util';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(): Promise<PublicUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toPublicUser);
  }

  async getUserById(id: number): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }
    return toPublicUser(user);
  }

  async createUser(user: CreateUserDto): Promise<PublicUser> {
    const createdUser = await this.userRepository.create(user);
    return toPublicUser(createdUser);
  }

  async updateUser(id: number, user: UpdateUserDto): Promise<PublicUser> {
    const updatedUser = await this.userRepository.update(id, user);
    if (!updatedUser) {
      throw new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }
    return toPublicUser(updatedUser);
  }

  async setUserBlocked(id: number, isBlocked: boolean): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }

    if (user.role === Role.ADMIN) {
      throw new AppException('Admin users cannot be blocked or unblocked', {
        code: 'ADMIN_BLOCK_FORBIDDEN',
        status: 403,
      });
    }

    const updatedUser = await this.userRepository.setBlocked(id, isBlocked);
    if (!updatedUser) {
      throw new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }

    return toPublicUser(updatedUser);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    }

    await this.userRepository.delete(id);
  }
}
