import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { UserRepository } from './repositories/user.repository';
import {
  CreateUserInput,
  PublicUser,
  Role,
  UpdateUserInput,
} from './interfaces/user.interface';
import { toPublicUser } from './utils/public-user.util';
import { AppException } from '../common/exceptions/app.exception';
import { UploadsService } from '../uploads/uploads.service';
import type { FileToStore } from '../uploads/interfaces/file-storage.interface';
import { USER_REPOSITORY } from './constants/user.tokens';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly uploadsService: UploadsService,
  ) {}

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

  async createUser(user: CreateUserInput): Promise<PublicUser> {
    const saltRounds = this.configService.getOrThrow<number>(
      'auth.bcryptSaltRounds',
    );
    const password = await bcrypt.hash(user.password, saltRounds);
    const createdUser = await this.userRepository.create({
      ...user,
      email: user.email.trim().toLowerCase(),
      password,
    });
    return toPublicUser(createdUser);
  }

  async updateUser(id: number, user: UpdateUserInput): Promise<PublicUser> {
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
    await this.deleteFileSafely(user.profileImagePublicId);
  }

  async updateProfileImage(
    userId: number,
    file: FileToStore,
  ): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    const uploadedImage = await this.uploadsService.uploadImage(file);

    try {
      const updatedUser = await this.userRepository.updateProfileImage(userId, {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      });

      if (!updatedUser) throw this.userNotFoundException();

      await this.deleteFileSafely(user.profileImagePublicId);
      return toPublicUser(updatedUser);
    } catch (error) {
      await this.deleteFileSafely(uploadedImage.publicId);
      throw error;
    }
  }

  async removeProfileImage(userId: number): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    const updatedUser = await this.userRepository.updateProfileImage(
      userId,
      null,
    );

    if (!updatedUser) throw this.userNotFoundException();

    await this.deleteFileSafely(user.profileImagePublicId);
    return toPublicUser(updatedUser);
  }

  private async requireUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw this.userNotFoundException();
    return user;
  }

  private userNotFoundException() {
    return new AppException('User not found', {
      code: 'USER_NOT_FOUND',
      status: 404,
    });
  }

  private async deleteFileSafely(publicId: string | null): Promise<void> {
    if (!publicId) return;

    try {
      await this.uploadsService.deleteFile(publicId);
    } catch (error) {
      this.logger.warn(`Cloudinary cleanup failed for ${publicId}`, error);
    }
  }
}
