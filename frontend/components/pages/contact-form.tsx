'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MessageSquareText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { apiFetch } from '@/lib/api';
import type { ContactMessage } from '@/lib/types';

interface ContactValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>();
  const sendMessage = useMutation({
    mutationFn: (values: ContactValues) =>
      apiFetch<ContactMessage>('/contact-messages', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      reset();
      toast.success('Your message has been received');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="bg-white px-5 py-24 lg:px-8">
      <div className="mx-auto grid gap-10 lg:grid-cols-[0.7fr_1fr]">
        <div>
          <MessageSquareText className="text-accent" size={30} />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Send a message
          </p>
          <h2 className="display mt-3 text-5xl">How can we help?</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-black/50">
            Share your product, account or order question. The support team can
            track it from the admin dashboard.
          </p>
        </div>
        <form
          onSubmit={handleSubmit((values) => sendMessage.mutate(values))}
          className="grid gap-5 rounded-[2rem] border bg-paper p-6 shadow-soft sm:grid-cols-2 sm:p-8"
        >
          <Field label="Your name" error={errors.name?.message}>
            <Input
              {...register('name', {
                required: 'Name is required.',
                minLength: { value: 2, message: 'Use at least 2 characters.' },
              })}
            />
          </Field>
          <Field label="Email address" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email.',
                },
              })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Subject" error={errors.subject?.message}>
              <Input
                {...register('subject', {
                  required: 'Subject is required.',
                  minLength: {
                    value: 3,
                    message: 'Use at least 3 characters.',
                  },
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Message" error={errors.message?.message}>
              <textarea
                rows={7}
                className="w-full rounded-2xl border bg-white/65 p-4 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
                {...register('message', {
                  required: 'Message is required.',
                  minLength: {
                    value: 10,
                    message: 'Use at least 10 characters.',
                  },
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={sendMessage.isPending}>
              <Send size={16} /> Send message
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
