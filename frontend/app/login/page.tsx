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

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success('Welcome back');
      router.push('/shop');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in');
    }
  });

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up where you left off."
      intro="Sign in to access your saved cart and continue exploring."
      footer={
        <>
          New to DeviceDock?{' '}
          <Link href="/register" className="font-bold text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email address" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className="h-14 w-full rounded-2xl border bg-white/50 px-4"
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="At least 6 characters"
            {...register('password')}
            className="h-14 w-full rounded-2xl border bg-white/50 px-4"
          />
        </Field>
        <button
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-full bg-ink font-bold text-white hover:bg-accent disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Sign in'}
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
