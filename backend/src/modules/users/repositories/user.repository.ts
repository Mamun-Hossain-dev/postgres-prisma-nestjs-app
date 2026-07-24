import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfileImage,
} from '../interfaces/user.interface';
import type {
  RepositoryPaginatedResult,
  RepositoryPaginationOptions,
} from '../../../common/interfaces/pagination.interface';

export interface UserRepository {
  findAll(
    options: RepositoryPaginationOptions,
  ): Promise<RepositoryPaginatedResult<User>>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: CreateUserInput, image?: UserProfileImage): Promise<User>;
  update(
    id: number,
    user: UpdateUserInput,
    image?: UserProfileImage,
  ): Promise<User | null>;
  setBlocked(id: number, isBlocked: boolean): Promise<User | null>;
  updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null>;
  delete(id: number): Promise<void>;
}
