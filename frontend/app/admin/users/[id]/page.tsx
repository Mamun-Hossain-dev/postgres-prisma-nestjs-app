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
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

export default function AdminUserPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'user', params.id],
    queryFn: () => apiFetch<User>(`/users/${params.id}`, {}, accessToken),
    enabled: !!accessToken,
  });
  const status = useMutation({
    mutationFn: (blocked: boolean) =>
      apiFetch<User>(
        `/users/${params.id}/${blocked ? 'block' : 'unblock'}`,
        { method: 'PATCH' },
        accessToken,
      ),
    onSuccess: (user) => {
      queryClient.setQueryData(['admin', 'user', params.id], user);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`Account ${user.isBlocked ? 'blocked' : 'unblocked'}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: () =>
      apiFetch<null>(`/users/${params.id}`, { method: 'DELETE' }, accessToken),
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
      <section className="mt-7 overflow-hidden rounded-[2.25rem] border bg-white/55 shadow-soft">
        <div className="bg-ink p-8 text-white sm:p-10">
          <span className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-accent text-3xl font-bold">
            {user.name[0]}
          </span>
          <p className="mt-7 text-xs uppercase tracking-[0.2em] text-white/40">
            DD-{String(user.id).padStart(5, '0')} · {user.role}
          </p>
          <h1 className="display mt-2 text-5xl">{user.name}</h1>
          <p className="mt-2 text-white/50">{user.email}</p>
        </div>
        <div className="grid gap-4 p-7 sm:grid-cols-2 sm:p-10">
          <button
            disabled={status.isPending || user.role === 'ADMIN'}
            onClick={() => status.mutate(!user.isBlocked)}
            className="flex items-center justify-center gap-2 rounded-full border px-6 py-4 font-bold hover:bg-ink hover:text-white disabled:opacity-40"
          >
            {user.isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
            {user.isBlocked ? 'Unblock account' : 'Block account'}
          </button>
          <button
            disabled={remove.isPending || user.role === 'ADMIN'}
            onClick={() => remove.mutate()}
            className="flex items-center justify-center gap-2 rounded-full border border-red-200 px-6 py-4 font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-40"
          >
            <Trash2 size={18} /> Delete account
          </button>
        </div>
      </section>
    </main>
  );
}
