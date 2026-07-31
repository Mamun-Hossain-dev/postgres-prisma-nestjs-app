'use client';

import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import type {
  ContactMessage,
  ContactStatus,
  PaginatedContactMessages,
} from '@/lib/types';

export function AdminContactMessages() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const params = new URLSearchParams({ page: '1', limit: '100' });
  if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
  const messages = useQuery({
    queryKey: ['admin', 'contact-messages', params.toString()],
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
        { method: 'PATCH', body: JSON.stringify({ status }) },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success('Message status updated');
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'contact-messages'],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Support inbox
      </p>
      <h1 className="display mt-2 text-5xl sm:text-6xl">Messages.</h1>
      <div className="mt-8 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <label className="flex items-center gap-3 border-b p-5">
          <Search size={17} className="text-black/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or subject"
            className="h-10 flex-1 bg-transparent text-sm"
          />
        </label>
        <div className="divide-y">
          {messages.data?.data.length ? (
            messages.data.data.map((message) => (
              <article
                key={message.id}
                className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_180px]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold">{message.subject}</p>
                    <Badge
                      tone={
                        message.status === 'RESOLVED'
                          ? 'success'
                          : message.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'accent'
                      }
                    >
                      {message.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-black/45">
                    <Mail size={13} /> {message.name} · {message.email}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-black/65">
                    {message.message}
                  </p>
                </div>
                <select
                  value={message.status}
                  disabled={updateStatus.isPending}
                  onChange={(event) =>
                    updateStatus.mutate({
                      id: message.id,
                      status: event.target.value as ContactStatus,
                    })
                  }
                  aria-label={`Status for ${message.subject}`}
                  className="h-11 rounded-xl border bg-white/70 px-3 text-sm"
                >
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
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
