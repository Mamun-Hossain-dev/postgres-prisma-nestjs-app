import { PublicUser } from '../../users/interfaces/user.interface';

export interface AuthenticatedRequest {
  user: PublicUser;
}
