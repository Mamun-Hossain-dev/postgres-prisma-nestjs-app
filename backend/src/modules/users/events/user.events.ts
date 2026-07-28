import type { PublicUser } from '../interfaces/user.interface';

export const UserEvents = {
  CREATED_EMAIL: 'user.created.email',
  CREATED_NOTIFICATION: 'user.created.notification',
  CREATED_ANALYTICS: 'user.created.analytics',
} as const;

export type UserCreatedEvent = PublicUser;
