export const Role = {
  USER: 'USER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface User {
  id: number;
  email: string;
  name: string;
  age: number;
  password: string;
  role: Role;
  isBlocked: boolean;
}

export type PublicUser = Omit<User, 'password'>;
