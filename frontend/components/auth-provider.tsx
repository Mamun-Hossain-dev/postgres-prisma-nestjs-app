'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { apiFetch, registerTokenRefresher } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  syncUser(user: User): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();

  const refreshAccessToken = useCallback(async () => {
    try {
      const updated = await update({ refreshAccessToken: true });
      if (!updated?.accessToken || updated.error) return null;
      return updated.accessToken;
    } catch {
      return null;
    }
  }, [update]);

  useEffect(() => {
    registerTokenRefresher(refreshAccessToken);
    return () => registerTokenRefresher(null);
  }, [refreshAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading: status === 'loading',
      async login(email, password) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (!result?.ok) throw new Error(result?.error ?? 'Unable to sign in');
      },
      async register(name, email, password) {
        await apiFetch<User>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (!result?.ok) throw new Error(result?.error ?? 'Unable to sign in');
      },
      async logout() {
        await signOut({ redirect: false });
      },
      async syncUser(user) {
        await update({ user });
      },
    }),
    [session, status, update],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
