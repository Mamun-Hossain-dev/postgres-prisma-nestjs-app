import { Injectable } from '@nestjs/common';
import type { UserRepository } from './user.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfileImage,
} from '../interfaces/user.interface';
import type { RepositoryPaginatedResult } from '../../../common/interfaces/pagination.interface';
import type { UserListOptions } from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    options: UserListOptions,
  ): Promise<RepositoryPaginatedResult<User>> {
    const where = options.role ? { role: options.role } : undefined;
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: options.skip,
        take: options.take,
        where,
        orderBy: { id: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, totalItems };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { googleId } });
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

  async linkGoogleAccount(id: number, googleId: string): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) return null;

    return this.prisma.user.update({
      where: { id },
      data: { googleId },
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

  async updatePassword(id: number, password: string): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) return null;
    return this.prisma.user.update({ where: { id }, data: { password } });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
