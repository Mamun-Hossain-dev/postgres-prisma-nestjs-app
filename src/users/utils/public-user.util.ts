import { User, type PublicUser } from '../interfaces/user.interface';

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
