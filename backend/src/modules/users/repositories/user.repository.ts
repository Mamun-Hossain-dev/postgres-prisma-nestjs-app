import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfileImage,
} from '../interfaces/user.interface';
import type {
  RepositoryPaginationOptions,
  RepositoryPaginatedResult,
} from '../../../common/interfaces/pagination.interface';
import type { Role } from '../interfaces/user.interface';

export interface UserListOptions extends RepositoryPaginationOptions {
  role?: Role;
}

export interface UserRepository {
  findAll(options: UserListOptions): Promise<RepositoryPaginatedResult<User>>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: CreateUserInput, image?: UserProfileImage): Promise<User>;
  update(
    id: number,
    user: UpdateUserInput,
    image?: UserProfileImage,
  ): Promise<User | null>;
  setBlocked(id: number, isBlocked: boolean): Promise<User | null>;
  linkGoogleAccount(id: number, googleId: string): Promise<User | null>;
  updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null>;
  updatePassword(id: number, password: string): Promise<User | null>;
  delete(id: number): Promise<void>;
}
