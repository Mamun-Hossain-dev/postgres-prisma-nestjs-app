import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { ApiEnvelope, AuthResult } from './types';
import type { JWT } from 'next-auth/jwt';

const internalApiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080/api/v1';

function readRefreshToken(response: Response) {
  const cookie = response.headers.get('set-cookie');
  return cookie?.match(/(?:^|;\s*)refresh_token=([^;]+)/)?.[1];
}

async function refreshBackendToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${internalApiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${token.refreshToken}` },
      cache: 'no-store',
    });
    const payload = (await response
      .json()
      .catch(() => null)) as ApiEnvelope<AuthResult> | null;
    if (!response.ok || !payload?.data) throw new Error('Refresh failed');

    return {
      ...token,
      accessToken: payload.data.accessToken,
      accessTokenExpires: Date.now() + 14 * 60 * 1000,
      refreshToken: readRefreshToken(response) ?? token.refreshToken,
      user: payload.data.user,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { prompt: 'select_account' } },
      httpOptions: { timeout: 15_000 },
    }),
    CredentialsProvider({
      name: 'DeviceDock account',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const response = await fetch(`${internalApiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as
          ApiEnvelope<AuthResult> | { message?: string } | null;

        if (!response.ok || !payload || !('data' in payload)) {
          throw new Error(payload?.message ?? 'Invalid email or password');
        }

        const refreshToken = readRefreshToken(response);
        if (!refreshToken) throw new Error('Unable to create a session');

        return {
          id: String(payload.data.user.id),
          name: payload.data.user.name,
          email: payload.data.user.email,
          backendUser: payload.data.user,
          accessToken: payload.data.accessToken,
          refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;
      if (!account.id_token) return false;

      const response = await fetch(`${internalApiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: account.id_token }),
        cache: 'no-store',
      });
      const payload = (await response
        .json()
        .catch(() => null)) as ApiEnvelope<AuthResult> | null;

      if (!response.ok || !payload?.data) return false;

      const refreshToken = readRefreshToken(response);
      if (!refreshToken) return false;

      user.backendUser = payload.data.user;
      user.accessToken = payload.data.accessToken;
      user.refreshToken = refreshToken;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = user.backendUser;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000;
        return token;
      }

      if (trigger === 'update' && session?.user) {
        token.user = { ...token.user, ...session.user };
      }

      if (Date.now() < token.accessTokenExpires) return token;
      return refreshBackendToken(token);
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.refreshToken) return;
      await fetch(`${internalApiUrl}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${token.refreshToken}` },
      }).catch(() => undefined);
    },
  },
};
