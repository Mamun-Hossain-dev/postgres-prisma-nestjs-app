import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUser } from './interfaces/user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser } from './utils/public-user.util';

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
      throw new NotFoundException('User not found');
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
      throw new NotFoundException('User not found');
    }
    return toPublicUser(updatedUser);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);
  }
}
