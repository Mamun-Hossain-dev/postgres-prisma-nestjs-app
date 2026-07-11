export const Role = {
  USER: 'USER',
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
}

export type PublicUser = Omit<User, 'password'>;
