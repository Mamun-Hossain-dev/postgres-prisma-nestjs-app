import type { User as AppUser } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: AppUser;
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    backendUser: AppUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    user: AppUser;
    error?: 'RefreshAccessTokenError';
  }
}
