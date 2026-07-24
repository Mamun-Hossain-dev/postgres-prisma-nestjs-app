import type { PublicUser } from '../../modules/users/interfaces/user.interface';

export interface AuthenticatedRequest {
  user: PublicUser;
}
