'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  LoaderCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

export function AdminUserDetails({ userId }: { userId: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => apiFetch<User>(`/users/${userId}`, {}, accessToken),
    enabled: !!accessToken,
  });
  const status = useMutation({
    mutationFn: (blocked: boolean) =>
      apiFetch<User>(
        `/users/${userId}/${blocked ? 'block' : 'unblock'}`,
        { method: 'PATCH' },
        accessToken,
      ),
    onSuccess: (user) => {
      queryClient.setQueryData(['admin', 'user', userId], user);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`Account ${user.isBlocked ? 'blocked' : 'unblocked'}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () =>
      apiFetch<null>(`/users/${userId}`, { method: 'DELETE' }, accessToken),
    onSuccess: () => {
      toast.success('User deleted');
      router.push('/admin/users');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const user = query.data;
  if (!user)
    return (
      <div className="grid min-h-96 place-items-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  return (
    <main>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-bold text-black/50"
      >
        <ArrowLeft size={16} /> Customer directory
      </Link>
      <section className="mt-6 overflow-hidden rounded-[2.25rem] border bg-white/55 shadow-soft">
        <div className="bg-ink p-8 text-white sm:p-10">
          <span className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-accent text-3xl font-bold">
            {user.name[0]}
          </span>
          <p className="mt-7 text-xs uppercase tracking-[0.2em] text-white/40">
            DD-{String(user.id).padStart(5, '0')} · {user.role}
          </p>
          <h1 className="display mt-2 text-4xl leading-tight md:text-5xl">
            {user.name}
          </h1>
          <p className="mt-2 text-white/50">{user.email}</p>
        </div>
        <div className="grid gap-4 p-7 sm:grid-cols-2 sm:p-10">
          <Button
            variant="outline"
            disabled={status.isPending || user.role === 'ADMIN'}
            onClick={() => status.mutate(!user.isBlocked)}
            loading={status.isPending}
            className="h-12"
          >
            {user.isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
            {user.isBlocked ? 'Unblock account' : 'Block account'}
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending || user.role === 'ADMIN'}
            onClick={() => remove.mutate()}
            loading={remove.isPending}
            className="h-12"
          >
            <Trash2 size={18} /> Delete account
          </Button>
        </div>
      </section>
    </main>
  );
}
