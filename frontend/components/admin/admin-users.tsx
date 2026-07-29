'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import type { PaginatedUsers } from '@/lib/types';

export function AdminUsers() {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () =>
      apiFetch<PaginatedUsers>('/users?page=1&limit=100', {}, accessToken),
    enabled: !!accessToken,
  });
  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Account directory
      </p>
      <h1 className="display mt-2 text-6xl">Customers.</h1>
      <div className="mt-9 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        {query.isLoading ? (
          <div className="grid min-h-72 place-items-center">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {query.data?.data.map((user) => (
              <Link
                href={`/admin/users/${user.id}`}
                key={user.id}
                className="grid gap-3 p-5 transition hover:bg-white sm:grid-cols-[1fr_1fr_110px_40px] sm:items-center sm:px-7"
              >
                <div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-xs text-black/40">
                    DD-{String(user.id).padStart(5, '0')}
                  </p>
                </div>
                <p className="text-sm text-black/55">{user.email}</p>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  {user.isBlocked ? 'BLOCKED' : user.role}
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
