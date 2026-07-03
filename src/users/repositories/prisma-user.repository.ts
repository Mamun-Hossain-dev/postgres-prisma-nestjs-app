import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../interfaces/user.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(user: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({
      data: user,
    });
  }

  async update(id: number, user: UpdateUserDto): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return null;
    }

    return await this.prisma.user.update({
      where: { id },
      data: user,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
