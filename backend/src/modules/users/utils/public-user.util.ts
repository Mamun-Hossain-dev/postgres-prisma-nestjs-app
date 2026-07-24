import { User, type PublicUser } from '../interfaces/user.interface';

export function toPublicUser(user: User): PublicUser {
  const publicUser = { ...user };
  delete (publicUser as Partial<User>).password;
  delete (publicUser as Partial<User>).profileImagePublicId;
  return publicUser;
}
