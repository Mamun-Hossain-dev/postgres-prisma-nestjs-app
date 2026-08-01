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
  phone: string | null;
  age: number;
  password: string | null;
  googleId: string | null;
  role: Role;
  isBlocked: boolean;
  marketingConsent: boolean;
  profileImageUrl: string | null;
  profileImagePublicId: string | null;
}

export type PublicUser = Omit<
  User,
  'password' | 'googleId' | 'profileImagePublicId'
>;

export interface UserProfileImage {
  url: string;
  publicId: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  age?: number;
  phone?: string;
  marketingConsent?: boolean;
  role: Role;
  password?: string;
  googleId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  age?: number;
  phone?: string;
  marketingConsent?: boolean;
}
