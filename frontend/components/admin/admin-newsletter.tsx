'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MailCheck, Send, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { apiFetch } from '@/lib/api';
import type {
  NewsletterBroadcast,
  PaginatedNewsletterBroadcasts,
  PaginatedNewsletterSubscribers,
} from '@/lib/types';

interface BroadcastValues {
  subject: string;
  previewText: string;
  content: string;
}

export function AdminNewsletter() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const subscribers = useQuery({
    queryKey: ['admin', 'newsletter', 'subscribers'],
    queryFn: () =>
      apiFetch<PaginatedNewsletterSubscribers>(
        '/newsletter/subscribers?page=1&limit=100',
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const broadcasts = useQuery({
    queryKey: ['admin', 'newsletter', 'broadcasts'],
    queryFn: () =>
      apiFetch<PaginatedNewsletterBroadcasts>(
        '/newsletter/broadcasts?page=1&limit=20',
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BroadcastValues>();
  const send = useMutation({
    mutationFn: (values: BroadcastValues) =>
      apiFetch<NewsletterBroadcast>(
        '/newsletter/broadcasts',
        {
          method: 'POST',
          body: JSON.stringify({
            ...values,
            previewText: values.previewText.trim() || undefined,
          }),
        },
        accessToken,
      ),
    onSuccess: async (broadcast) => {
      reset();
      toast.success(
        `Broadcast finished: ${broadcast.sentCount}/${broadcast.recipientCount} delivered`,
      );
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'newsletter', 'broadcasts'],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeSubscribers =
    subscribers.data?.data.filter((item) => item.status === 'ACTIVE').length ??
    0;

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Audience messaging
      </p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">Broadcasts.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
        Send consent-based email updates and review every campaign result.
      </p>

      <div className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit((values) => send.mutate(values))}
          className="grid content-start gap-5 rounded-[2rem] border bg-white/55 p-6 shadow-soft sm:p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">New broadcast</p>
              <p className="mt-1 text-xs text-black/45">
                Sends to all active subscribers.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-bold text-white">
              <UsersRound size={14} /> {activeSubscribers} active
            </span>
          </div>
          <Field label="Subject" error={errors.subject?.message}>
            <Input
              {...register('subject', {
                required: 'Subject is required.',
                minLength: { value: 3, message: 'Use at least 3 characters.' },
              })}
            />
          </Field>
          <Field
            label="Preview text"
            hint="Optional inbox preview shown before the message."
          >
            <Input {...register('previewText')} />
          </Field>
          <Field label="Message" error={errors.content?.message}>
            <textarea
              rows={10}
              className="w-full rounded-2xl border bg-white/65 p-4 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
              {...register('content', {
                required: 'Message is required.',
                minLength: {
                  value: 10,
                  message: 'Use at least 10 characters.',
                },
              })}
            />
          </Field>
          <Button type="submit" loading={send.isPending} className="w-fit">
            <Send size={16} /> Send broadcast
          </Button>
        </form>

        <div className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
          <div className="flex items-center gap-3 border-b p-6">
            <MailCheck className="text-accent" />
            <div>
              <p className="font-bold">Broadcast history</p>
              <p className="text-xs text-black/40">
                {broadcasts.data?.meta.totalItems ?? 0} campaigns
              </p>
            </div>
          </div>
          <div className="divide-y">
            {broadcasts.data?.data.length ? (
              broadcasts.data.data.map((broadcast) => (
                <article key={broadcast.id} className="p-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{broadcast.subject}</p>
                      <p className="mt-1 text-xs text-black/40">
                        {new Date(broadcast.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      tone={
                        broadcast.status === 'SENT'
                          ? 'success'
                          : broadcast.status === 'FAILED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {broadcast.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs font-semibold text-black/50">
                    <span>{broadcast.recipientCount} recipients</span>
                    <span>{broadcast.sentCount} sent</span>
                    <span>{broadcast.failedCount} failed</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-8 text-sm text-black/45">
                No broadcasts have been sent yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
