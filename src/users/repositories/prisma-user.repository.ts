import { Injectable } from '@nestjs/common';
import type { UserRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfileImage,
} from '../interfaces/user.interface';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(user: CreateUserInput, image?: UserProfileImage): Promise<User> {
    return await this.prisma.user.create({
      data: {
        ...user,
        profileImageUrl: image?.url,
        profileImagePublicId: image?.publicId,
      },
    });
  }

  async update(
    id: number,
    user: UpdateUserInput,
    image?: UserProfileImage,
  ): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return null;
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...user,
        profileImageUrl: image?.url,
        profileImagePublicId: image?.publicId,
      },
    });
  }

  async setBlocked(id: number, isBlocked: boolean): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return null;
    }

    return this.prisma.user.update({
      where: { id },
      data: { isBlocked },
    });
  }

  async updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) return null;

    return this.prisma.user.update({
      where: { id },
      data: {
        profileImageUrl: image?.url ?? null,
        profileImagePublicId: image?.publicId ?? null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
