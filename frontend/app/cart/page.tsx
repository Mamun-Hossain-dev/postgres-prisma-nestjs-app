'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, money } from '@/lib/api';
import type { Cart } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';

export default function CartPage() {
  const { accessToken, user, loading } = useAuth();
  const queryClient = useQueryClient();
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiFetch<Cart>('/cart', {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const update = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: number;
      quantity?: number;
    }) =>
      quantity
        ? apiFetch<Cart>(
            `/cart/items/${productId}`,
            { method: 'PATCH', body: JSON.stringify({ quantity }) },
            accessToken,
          )
        : apiFetch<Cart>(
            `/cart/items/${productId}`,
            { method: 'DELETE' },
            accessToken,
          ),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading) {
    return <div className="min-h-[70vh]" />;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Your cart
        </p>
        <h1 className="display mt-3 text-6xl">Sign in to keep your picks.</h1>
        <p className="mt-5 text-black/50">
          Your cart is securely linked to your DeviceDock account.
        </p>
        <Link href="/login" className="mt-8 rounded-full bg-ink px-7 py-4 font-bold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  if (cart.isLoading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  const data = cart.data;
  if (!data?.items.length) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Your cart</p>
        <h1 className="display mt-3 text-6xl">A little too quiet.</h1>
        <p className="mt-5 text-black/50">Add a device or two and they will appear here.</p>
        <Link
          href="/shop"
          className="mt-8 flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-bold text-white"
        >
          Explore products <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Your selection</p>
      <h1 className="display mt-3 text-6xl">Shopping cart.</h1>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="divide-y border-y">
          {data.items.map((item) => {
            const image = item.product.images[0]?.url;
            return (
              <article key={item.id} className="grid grid-cols-[100px_1fr] gap-5 py-6 sm:grid-cols-[140px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#d9d1c1]">
                  {image ? (
                    <Image src={image} alt={item.product.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-[24%] rotate-6 rounded-2xl bg-ink" />
                  )}
                </div>
                <div className="self-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                    {item.product.brand}
                  </p>
                  <h2 className="display mt-1 text-2xl">{item.product.title}</h2>
                  <p className="mt-2 text-sm font-bold">{money(item.product.price)}</p>
                  <div className="mt-4 flex w-28 items-center justify-between rounded-full border p-1">
                    <button
                      disabled={update.isPending || item.quantity === 1}
                      onClick={() =>
                        update.mutate({ productId: item.productId, quantity: item.quantity - 1 })
                      }
                      className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button
                      disabled={update.isPending || item.quantity >= item.product.quantity}
                      onClick={() =>
                        update.mutate({ productId: item.productId, quantity: item.quantity + 1 })
                      }
                      className="grid h-8 w-8 place-items-center rounded-full hover:bg-white disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => update.mutate({ productId: item.productId })}
                  className="col-start-2 flex items-center gap-2 self-center text-xs font-bold text-black/45 hover:text-red-600 sm:col-start-auto"
                >
                  <Trash2 size={16} /> Remove
                </button>
              </article>
            );
          })}
        </div>
        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Summary</p>
          <div className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/55">Items ({data.itemCount})</span>
              <span>{money(data.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Delivery</span>
              <span>Calculated later</span>
            </div>
          </div>
          <div className="my-6 h-px bg-white/15" />
          <div className="flex items-end justify-between">
            <span className="font-semibold">Subtotal</span>
            <span className="display text-3xl">{money(data.subtotal)}</span>
          </div>
          <button
            disabled
            className="mt-7 w-full rounded-full bg-white/15 px-6 py-4 font-bold text-white/50"
          >
            Checkout — coming next
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-white/35">
            Order placement and payment will be added in the next phase.
          </p>
        </aside>
      </div>
    </div>
  );
}
