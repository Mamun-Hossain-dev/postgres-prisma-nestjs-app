'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { PasswordInput } from '@/components/ui/password-input';
import { Field, Input } from '@/components/ui/field';
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button';

const schema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Values = z.infer<typeof schema>;

export function LoginPage() {
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
      const session = await getSession();
      const fallback = session?.user?.role === 'ADMIN' ? '/admin' : '/profile';
      const callbackUrl = new URLSearchParams(window.location.search).get(
        'callbackUrl',
      );
      router.push(callbackUrl?.startsWith('/') ? callbackUrl : fallback);
      router.refresh();
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
          <Link
            href="/register"
            className="font-bold text-ink underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleAuthButton />
        <AuthDivider />
      </div>
      <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
        <Field label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-full bg-ink font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
