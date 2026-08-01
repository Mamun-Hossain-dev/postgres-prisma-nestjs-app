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
import {
  PasswordInput,
  PasswordStrength,
} from '@/components/ui/password-input';
import { Field, Input } from '@/components/ui/field';
import { AuthDivider, GoogleAuthButton } from '@/components/google-auth-button';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email: z.string().trim().pipe(z.email('Enter a valid email address')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type Values = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const submit = handleSubmit(async (values) => {
    try {
      await createAccount(values.name, values.email, values.password);
      toast.success('Your account is ready');
      router.push('/profile');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create account',
      );
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
          <Link
            href="/login"
            className="font-bold text-ink underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleAuthButton />
        <AuthDivider />
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message}>
          <Input
            autoComplete="name"
            placeholder="e.g. Mamun Ahmed"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <PasswordStrength password={password} />
          </Field>
          <Field
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Enter it again"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-14 w-full items-center justify-center rounded-full bg-ink font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthShell>
  );
}
