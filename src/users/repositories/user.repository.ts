import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserProfileImage,
} from '../interfaces/user.interface';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  update(id: number, user: UpdateUserInput): Promise<User | null>;
  setBlocked(id: number, isBlocked: boolean): Promise<User | null>;
  updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null>;
  delete(id: number): Promise<void>;
}
