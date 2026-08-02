"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Select, type SelectOption } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type {
  ContactMessage,
  ContactStatus,
  PaginatedContactMessages,
} from "@/lib/types";
import { ListSkeleton } from "@/components/ui/skeleton";

const statusOptions: SelectOption[] = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

export function AdminContactMessages() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const params = new URLSearchParams({ page: "1", limit: "100" });
  if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
  const messages = useQuery({
    queryKey: ["admin", "contact-messages", params.toString()],
    queryFn: () =>
      apiFetch<PaginatedContactMessages>(
        `/contact-messages?${params}`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactStatus }) =>
      apiFetch<ContactMessage>(
        `/contact-messages/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Message status updated");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "contact-messages"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section>
      <AdminPageHeader
        eyebrow="Support inbox"
        title="Messages."
        description="Review customer inquiries and update their resolution status."
      />
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="relative border-b p-4">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or subject"
            aria-label="Search messages"
            className="h-11 pl-11"
          />
        </div>
        <div className="divide-y">
          {messages.isLoading ? (
            <ListSkeleton rows={6} />
          ) : messages.data?.data.length ? (
            messages.data.data.map((message) => (
              <article
                key={message.id}
                className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_200px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold">{message.subject}</p>
                    <Badge
                      tone={
                        message.status === "RESOLVED"
                          ? "success"
                          : message.status === "IN_PROGRESS"
                            ? "warning"
                            : "accent"
                      }
                    >
                      {message.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-black/45">
                    <Mail size={13} /> {message.name} · {message.email}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-black/65">
                    {message.message}
                  </p>
                </div>
                <Select
                  value={message.status}
                  onValueChange={(value) =>
                    updateStatus.mutate({
                      id: message.id,
                      status: value as ContactStatus,
                    })
                  }
                  options={statusOptions}
                  ariaLabel={`Status for ${message.subject}`}
                  className="w-full"
                />
              </article>
            ))
          ) : (
            <p className="p-10 text-center text-sm text-black/45">
              No contact messages found.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
