'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: createAccount } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (values) => {
    try {
      await createAccount(values.name, values.email, values.password);
      toast.success('Your account is ready');
      router.push('/shop');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create account');
    }
  });

  return (
    <AuthShell
      eyebrow="Join DeviceDock"
      title="A better way to choose tech."
      intro="Create your account to build a cart that stays with you."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" error={errors.name?.message}>
          <input
            autoComplete="name"
            placeholder="Your name"
            {...register('name')}
            className="h-14 w-full rounded-2xl border bg-white/50 px-4"
          />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className="h-14 w-full rounded-2xl border bg-white/50 px-4"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="h-14 w-full rounded-2xl border bg-white/50 px-4"
            />
          </Field>
          <Field label="Confirm" error={errors.confirmPassword?.message}>
            <input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="h-14 w-full rounded-2xl border bg-white/50 px-4"
            />
          </Field>
        </div>
        <button
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-full bg-ink font-bold text-white hover:bg-accent disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
