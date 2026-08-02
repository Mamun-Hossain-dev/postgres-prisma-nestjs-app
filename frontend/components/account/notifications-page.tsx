"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { AccountNotification, NotificationPreference } from "@/lib/types";

export function NotificationsPage() {
  const { accessToken } = useAuth();
  const client = useQueryClient();
  const preferences = useQuery({
    queryKey: ["account", "notification-preferences"],
    queryFn: () =>
      apiFetch<NotificationPreference>(
        "/account/notification-preferences",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const notifications = useQuery({
    queryKey: ["account", "notifications"],
    queryFn: () =>
      apiFetch<AccountNotification[]>(
        "/account/notifications",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const save = useMutation({
    mutationFn: (value: NotificationPreference) =>
      apiFetch<NotificationPreference>(
        "/account/notification-preferences",
        { method: "PATCH", body: JSON.stringify(value) },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Notification preferences saved");
      await client.invalidateQueries({
        queryKey: ["account", "notification-preferences"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const read = useMutation({
    mutationFn: (id: number) =>
      apiFetch<null>(
        `/account/notifications/${id}/read`,
        { method: "PATCH" },
        accessToken,
      ),
    onSuccess: async () =>
      client.invalidateQueries({ queryKey: ["account", "notifications"] }),
  });

  return (
    <AccountShell active="notifications">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] border bg-white/55 p-7 shadow-soft">
          <Bell className="text-accent" />
          <h1 className="display mt-5 text-4xl">Preferences.</h1>
          {preferences.data && (
            <div className="mt-6 grid gap-3">
              {(
                [
                  ["orderUpdates", "Order updates"],
                  ["productUpdates", "Product and stock updates"],
                  ["emailUpdates", "Email updates"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-xl border bg-white p-4 text-sm font-semibold"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={preferences.data[key]}
                    onChange={(event) =>
                      save.mutate({
                        ...preferences.data,
                        [key]: event.target.checked,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}
        </section>
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Inbox
          </p>
          <h2 className="display mt-2 text-5xl">Notifications.</h2>
          <div className="mt-6 grid gap-3">
            {notifications.data?.length ? (
              notifications.data.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-[1.5rem] border p-5 ${item.readAt ? "bg-white/35" : "bg-white/70"}`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="mt-2 text-sm text-black/50">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-black/35">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!item.readAt && (
                      <Button
                        variant="ghost"
                        onClick={() => read.mutate(item.id)}
                      >
                        <Check size={16} /> Read
                      </Button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border bg-white/45 p-6 text-sm text-black/45">
                No notifications yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
