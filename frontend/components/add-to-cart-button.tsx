'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LoaderCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { Cart } from '@/lib/types';
import { useAuth } from './auth-provider';

export function AddToCartButton({
  productId,
  quantity = 1,
  compact = false,
  icon,
}: {
  productId: number;
  quantity?: number;
  compact?: boolean;
  icon?: React.ReactNode;
}) {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Cart>(
        '/cart/items',
        { method: 'POST', body: JSON.stringify({ productId, quantity }) },
        accessToken,
      ),
    onSuccess: (cart) => {
      queryClient.setQueryData(['cart'], cart);
      toast.success('Added to your cart');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleClick = () => {
    if (!user) {
      toast.info('Sign in to add products to your cart');
      router.push('/login');
      return;
    }
    mutation.mutate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-label="Add to cart"
      className={
        compact
          ? 'grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-transparent transition hover:border-ink hover:bg-ink hover:text-white'
          : 'flex h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-7 font-semibold text-white transition hover:bg-accent disabled:opacity-60'
      }
    >
      {mutation.isPending ? (
        <LoaderCircle className="animate-spin" size={18} />
      ) : (
        <>
          {icon ?? <ShoppingBag size={18} />}
          {!compact && 'Add to cart'}
        </>
      )}
    </button>
  );
}
