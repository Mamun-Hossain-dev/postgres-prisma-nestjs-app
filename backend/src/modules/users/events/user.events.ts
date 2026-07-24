import type { PublicUser } from '../interfaces/user.interface';

export const UserEvents = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
} as const;

export type UserCreatedEvent = PublicUser;
