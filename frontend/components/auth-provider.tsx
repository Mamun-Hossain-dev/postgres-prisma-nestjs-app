'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { AuthResult, User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuthResult>('/auth/refresh', { method: 'POST' })
      .then((result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      async login(email, password) {
        const result = await apiFetch<AuthResult>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      async register(name, email, password) {
        await apiFetch<User>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        const result = await apiFetch<AuthResult>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAccessToken(result.accessToken);
        setUser(result.user);
      },
      async logout() {
        await apiFetch('/auth/logout', { method: 'POST' });
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
