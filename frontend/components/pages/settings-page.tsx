'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { AccountShell } from '@/components/account-shell';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';

interface Values {
  name: string;
  email: string;
  phone: string;
  age?: number;
  marketingConsent: boolean;
}

export function SettingsPage() {
  const { user, accessToken, syncUser } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [removingImage, setRemovingImage] = useState(false);
  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        age: user.age,
        marketingConsent: user.marketingConsent,
      });
    }
  }, [reset, user]);

  const submit = handleSubmit(async (values) => {
    const body = new FormData();
    body.set('name', values.name.trim());
    body.set('email', values.email.trim());
    body.set('phone', values.phone.trim());
    if (values.age && !Number.isNaN(values.age))
      body.set('age', String(values.age));
    body.set('marketingConsent', String(values.marketingConsent));
    if (image) body.set('image', image);

    try {
      const updated = await apiFetch<User>(
        '/users/me',
        { method: 'PATCH', body },
        accessToken,
      );
      await apiFetch(
        '/newsletter/subscribers',
        {
          method: values.marketingConsent ? 'POST' : 'DELETE',
          body: JSON.stringify({
            email: updated.email,
            name: updated.name,
          }),
        },
        accessToken,
      );
      await syncUser(updated);
      setImage(null);
      toast.success('Profile settings saved');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save settings',
      );
    }
  });

  const removeProfileImage = async () => {
    setRemovingImage(true);
    try {
      const updated = await apiFetch<User>(
        '/users/me/profile-image',
        { method: 'DELETE' },
        accessToken,
      );
      await syncUser(updated);
      setImage(null);
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to remove photo',
      );
    } finally {
      setRemovingImage(false);
    }
  };

  const currentImage = preview ?? user?.profileImageUrl;

  return (
    <AccountShell active="personal">
      <section className="rounded-[2.25rem] border bg-white/55 p-7 shadow-soft sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Personal details
        </p>
        <h2 className="display mt-3 text-5xl">Make it yours.</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-black/50">
          Keep your identity, contact details and profile photo current.
        </p>

        <div className="mt-9 flex flex-col gap-5 rounded-[1.5rem] border bg-paper p-5 sm:flex-row sm:items-center">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[1.75rem] bg-ink text-white">
            {currentImage ? (
              <Image
                src={currentImage}
                alt="Profile preview"
                fill
                unoptimized={Boolean(preview)}
                className="object-cover"
              />
            ) : (
              <UserRound size={30} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold">Profile photo</p>
            <p className="mt-1 text-xs leading-5 text-black/45">
              JPEG, PNG, WebP or GIF.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border bg-white px-4 text-xs font-bold transition hover:border-ink focus-within:ring-2 focus-within:ring-accent">
                <Camera size={15} /> Choose photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              {(user?.profileImageUrl || image) && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-4 text-xs text-red-700"
                  loading={removingImage}
                  onClick={() => {
                    if (image) setImage(null);
                    else void removeProfileImage();
                  }}
                >
                  <Trash2 size={15} /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <Input
              autoComplete="name"
              {...register('name', {
                required: 'Full name is required.',
                minLength: { value: 2, message: 'Use at least 2 characters.' },
              })}
            />
          </Field>
          <Field label="Email address" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email.',
                },
              })}
            />
          </Field>
          <Field label="Age" error={errors.age?.message}>
            <Input
              type="number"
              min={1}
              {...register('age', {
                valueAsNumber: true,
                min: { value: 1, message: 'Enter a valid age.' },
              })}
            />
          </Field>
          <Field label="Phone number">
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="+880..."
              {...register('phone')}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border bg-white/65 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#b4472f]"
              {...register('marketingConsent')}
            />
            <span>
              <span className="block text-sm font-bold">
                DeviceDock email updates
              </span>
              <span className="mt-0.5 block text-xs text-black/45">
                Receive product drops and offer broadcasts. You can opt out here
                anytime.
              </span>
            </span>
          </label>
          <div className="self-end">
            <Button
              loading={isSubmitting}
              className="h-12 w-full"
              type="submit"
            >
              <Save size={17} /> Save changes
            </Button>
          </div>
        </form>
      </section>
    </AccountShell>
  );
}
