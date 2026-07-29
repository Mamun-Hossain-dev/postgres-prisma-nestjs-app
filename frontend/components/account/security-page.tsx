'use client';

import { useState } from 'react';
import { KeyRound, Laptop, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AccountShell } from '@/components/account-shell';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiFetch } from '@/lib/api';

export function SecurityPage() {
  const { accessToken, logout } = useAuth();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch<null>('/users/me', { method: 'DELETE' }, accessToken);
      await logout();
      toast.success('Your account has been deleted');
      router.replace('/');
      router.refresh();
    } catch (error) {
      setDeleting(false);
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete account',
      );
    }
  };

  return (
    <AccountShell active="security">
      <div className="grid gap-5">
        <section className="rounded-[2rem] border bg-white/55 p-7 shadow-soft sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <ShieldCheck />
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Account safety
          </p>
          <h2 className="display mt-2 text-5xl">Security.</h2>
          <p className="mt-4 max-w-xl leading-7 text-black/50">
            Your session uses short-lived access tokens and a rotating
            refresh-token cookie.
          </p>
        </section>
        <SecurityItem
          icon={<KeyRound />}
          title="Change password"
          description="Password update requires a verified current-password backend endpoint."
          status="API pending"
        />
        <SecurityItem
          icon={<Laptop />}
          title="Active sessions"
          description="Device-level session listing and revocation require a session-management endpoint."
          status="API pending"
        />
        <section className="rounded-[2rem] border border-red-200 bg-red-50/70 p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-red-900">Delete account</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-red-800/65">
                Permanently remove your profile and associated account data.
                This cannot be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={17} /> Delete account
            </Button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Permanently delete your account?"
        description="Your profile and account data will be removed. This action cannot be reversed."
        confirmLabel="Delete my account"
        danger
        loading={deleting}
        onConfirm={() => void deleteAccount()}
      />
    </AccountShell>
  );
}

function SecurityItem({
  icon,
  title,
  description,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <section className="flex items-start gap-4 rounded-[1.5rem] border bg-white/55 p-6">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/5">
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-black/50">{description}</p>
      </div>
      <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black/45">
        {status}
      </span>
    </section>
  );
}
