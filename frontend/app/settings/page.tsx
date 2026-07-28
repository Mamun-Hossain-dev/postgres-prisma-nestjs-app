'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LoaderCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AccountShell } from '@/components/account-shell';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

interface Values {
  name: string;
  email: string;
  age?: number;
}

export default function SettingsPage() {
  const { user, accessToken, syncUser } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Values>();

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email, age: user.age });
  }, [reset, user]);

  const submit = handleSubmit(async (values) => {
    try {
      const updated = await apiFetch<User>(
        '/users/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...values,
            age: values.age ? Number(values.age) : undefined,
          }),
        },
        accessToken,
      );
      await syncUser(updated);
      toast.success('Profile settings saved');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save settings',
      );
    }
  });

  return (
    <AccountShell active="settings">
      <section className="rounded-[2.25rem] border bg-white/45 p-7 shadow-soft sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Personal details
        </p>
        <h1 className="display mt-3 text-5xl">Make it yours.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
          Keep your identity and contact details current across DeviceDock.
        </p>
        <form onSubmit={submit} className="mt-10 grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              {...register('name', { required: true })}
              className="field"
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              {...register('email', { required: true })}
              className="field"
            />
          </Field>
          <Field label="Age">
            <input
              type="number"
              min={1}
              {...register('age', { valueAsNumber: true })}
              className="field"
            />
          </Field>
          <div className="self-end">
            <button
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink font-bold text-white hover:bg-accent disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}{' '}
              Save changes
            </button>
          </div>
        </form>
      </section>
    </AccountShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
