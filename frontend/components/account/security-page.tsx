"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Laptop, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { apiFetch } from "@/lib/api";
import type { AuthSession } from "@/lib/types";

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
}

export function SecurityPage() {
  const { accessToken, logout } = useAuth();
  const router = useRouter();
  const client = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset, formState } =
    useForm<PasswordValues>();
  const sessions = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiFetch<AuthSession[]>("/auth/sessions", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const changePassword = useMutation({
    mutationFn: (values: PasswordValues) =>
      apiFetch<null>(
        "/users/me/password",
        { method: "PATCH", body: JSON.stringify(values) },
        accessToken,
      ),
    onSuccess: () => {
      reset();
      toast.success("Password updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/auth/sessions/${id}`, { method: "DELETE" }, accessToken),
    onSuccess: async () => {
      toast.success("Session revoked");
      await client.invalidateQueries({ queryKey: ["auth", "sessions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch<null>("/users/me", { method: "DELETE" }, accessToken);
      await logout();
      toast.success("Your account has been deleted");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setDeleting(false);
      toast.error(
        error instanceof Error ? error.message : "Unable to delete account",
      );
    }
  };

  return (
    <AccountShell active="security">
      <div className="grid gap-5">
        <section className="rounded-[2rem] border bg-white/55 p-7 shadow-soft sm:p-9">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <ShieldCheck />
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Account safety
          </p>
          <h2 className="display mt-2 text-5xl">Security.</h2>
          <p className="mt-4 max-w-xl leading-7 text-black/50">
            Manage your password and revoke signed-in devices.
          </p>
        </section>
        <form
          onSubmit={handleSubmit((values) => changePassword.mutate(values))}
          className="rounded-[1.5rem] border bg-white/55 p-6"
        >
          <div className="flex items-center gap-3">
            <KeyRound />
            <h3 className="font-bold">Change password</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <Input type="password" {...register("currentPassword")} />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                {...register("newPassword", { required: true, minLength: 8 })}
              />
            </Field>
          </div>
          <Button
            className="mt-5"
            type="submit"
            loading={formState.isSubmitting || changePassword.isPending}
          >
            Update password
          </Button>
        </form>
        <section className="rounded-[1.5rem] border bg-white/55 p-6">
          <div className="flex items-center gap-3">
            <Laptop />
            <h3 className="font-bold">Active sessions</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {sessions.data?.length ? (
              sessions.data.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-bold">
                      {session.device || "Unknown device"}{" "}
                      {session.current && (
                        <span className="text-accent">· Current</span>
                      )}
                    </p>
                    <p className="mt-1 max-w-xl truncate text-xs text-black/45">
                      {session.ip} · {session.userAgent || "Unknown browser"}
                    </p>
                    <p className="mt-1 text-xs text-black/35">
                      Expires {new Date(session.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => revoke.mutate(session.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/45">
                No active refresh sessions found.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-[2rem] border border-red-200 bg-red-50/70 p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-red-900">Delete account</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-red-800/65">
                Permanently remove your profile and associated account data.
                This cannot be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={17} /> Delete account
            </Button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Permanently delete your account?"
        description="Your profile and account data will be removed. This action cannot be reversed."
        confirmLabel="Delete my account"
        danger
        loading={deleting}
        onConfirm={() => void deleteAccount()}
      />
    </AccountShell>
  );
}
