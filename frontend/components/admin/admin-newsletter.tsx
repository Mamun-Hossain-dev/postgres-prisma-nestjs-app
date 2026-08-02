"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Mail, MailCheck, Send, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type {
  NewsletterBroadcast,
  PaginatedNewsletterBroadcasts,
  PaginatedNewsletterSubscribers,
} from "@/lib/types";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";

interface BroadcastValues {
  subject: string;
  previewText: string;
  content: string;
}

export function AdminNewsletter() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const subscribers = useQuery({
    queryKey: ["admin", "newsletter", "subscribers"],
    queryFn: () =>
      apiFetch<PaginatedNewsletterSubscribers>(
        "/newsletter/subscribers?page=1&limit=100",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const broadcasts = useQuery({
    queryKey: ["admin", "newsletter", "broadcasts"],
    queryFn: () =>
      apiFetch<PaginatedNewsletterBroadcasts>(
        "/newsletter/broadcasts?page=1&limit=20",
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
        "/newsletter/broadcasts",
        {
          method: "POST",
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
        queryKey: ["admin", "newsletter", "broadcasts"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeSubscribers =
    subscribers.data?.data.filter((item) => item.status === "ACTIVE").length ??
    0;

  return (
    <section>
      <AdminPageHeader
        eyebrow="Audience messaging"
        title="Broadcasts."
        description="Send consent-based email updates and review every campaign result."
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
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
              <UsersRound size={14} />{" "}
              {subscribers.isLoading ? (
                <Skeleton className="h-3 w-12 bg-white/20" />
              ) : (
                `${activeSubscribers} active`
              )}
            </span>
          </div>
          <Field label="Subject" error={errors.subject?.message}>
            <Input
              {...register("subject", {
                required: "Subject is required.",
                minLength: { value: 3, message: "Use at least 3 characters." },
              })}
            />
          </Field>
          <Field
            label="Preview text"
            hint="Optional inbox preview shown before the message."
          >
            <Input {...register("previewText")} />
          </Field>
          <Field label="Message" error={errors.content?.message}>
            <Textarea
              rows={10}
              {...register("content", {
                required: "Message is required.",
                minLength: {
                  value: 10,
                  message: "Use at least 10 characters.",
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
            {broadcasts.isLoading ? (
              <ListSkeleton rows={5} />
            ) : broadcasts.data?.data.length ? (
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
                        broadcast.status === "SENT"
                          ? "success"
                          : broadcast.status === "FAILED"
                            ? "danger"
                            : "warning"
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
        <div className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft xl:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b p-6">
            <div className="flex items-center gap-3">
              <Mail className="text-accent" />
              <div>
                <p className="font-bold">Newsletter subscribers</p>
                <p className="text-xs text-black/40">
                  {subscribers.data?.meta.totalItems ?? 0} submitted emails
                </p>
              </div>
            </div>
          </div>
          {subscribers.isLoading ? (
            <ListSkeleton rows={5} />
          ) : subscribers.isError ? (
            <p className="p-8 text-sm text-red-700">
              {subscribers.error.message}
            </p>
          ) : subscribers.data?.data.length ? (
            <div className="divide-y">
              {subscribers.data.data.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="grid gap-2 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{subscriber.email}</p>
                    <p className="mt-1 text-xs text-black/40">
                      {subscriber.name || "Name not provided"}
                    </p>
                  </div>
                  <p className="text-xs text-black/45">
                    Joined {new Date(subscriber.subscribedAt).toLocaleString()}
                  </p>
                  <Badge
                    tone={
                      subscriber.status === "ACTIVE" ? "success" : "warning"
                    }
                  >
                    {subscriber.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-sm text-black/45">
              No newsletter emails have been submitted yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
