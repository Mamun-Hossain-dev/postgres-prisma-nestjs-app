import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User, UserProfileImage } from '../interfaces/user.interface';

export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: number): Promise<User | null>;
  abstract create(user: CreateUserDto): Promise<User>;
  abstract update(id: number, user: UpdateUserDto): Promise<User | null>;
  abstract setBlocked(id: number, isBlocked: boolean): Promise<User | null>;
  abstract updateProfileImage(
    id: number,
    image: UserProfileImage | null,
  ): Promise<User | null>;
  abstract delete(id: number): Promise<void>;
}
