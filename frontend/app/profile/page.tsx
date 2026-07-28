'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { AccountShell } from '@/components/account-shell';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<User>('/auth/profile', {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const current = profile.data ?? user;

  return (
    <AccountShell active="profile">
      <section className="overflow-hidden rounded-[2.25rem] border bg-white/45 shadow-soft">
        <div className="relative bg-[radial-gradient(circle_at_80%_15%,#d96c3d_0,transparent_32%),linear-gradient(135deg,#171816,#353930)] px-7 py-12 text-white sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Member profile
          </p>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-white/20 bg-white/10 text-4xl backdrop-blur">
              {current?.name?.slice(0, 1).toUpperCase() ?? <UserRound />}
            </div>
            <div>
              <h1 className="display text-5xl">
                {current?.name ?? 'Loading…'}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                <Mail size={15} /> {current?.email}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-7 sm:grid-cols-3 sm:p-10">
          <Info
            icon={<BadgeCheck />}
            label="Account role"
            value={current?.role ?? '—'}
          />
          <Info
            icon={<ShieldCheck />}
            label="Account status"
            value={current?.isBlocked ? 'Blocked' : 'Active'}
          />
          <Info
            icon={<UserRound />}
            label="Member ID"
            value={current ? `DD-${String(current.id).padStart(5, '0')}` : '—'}
          />
        </div>
      </section>
    </AccountShell>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-paper p-5">
      <span className="text-accent">{icon}</span>
      <p className="mt-5 text-xs uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
