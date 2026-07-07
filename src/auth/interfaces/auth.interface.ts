import { PublicUser } from '../../users/interfaces/user.interface';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
}
