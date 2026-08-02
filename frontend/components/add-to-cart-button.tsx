'use client';

import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { useCart } from './cart-provider';

export function AddToCartButton({
  product,
  quantity = 1,
  compact = false,
  icon,
}: {
  product: Product;
  quantity?: number;
  compact?: boolean;
  icon?: React.ReactNode;
}) {
  const { addItem } = useCart();

  const handleClick = () => {
    if (product.quantity < 1) {
      toast.error('This product is out of stock');
      return;
    }
    addItem(product, quantity);
    toast.success('Added to your cart');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={product.quantity < 1}
      aria-label="Add to cart"
      className={
        compact
          ? 'grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-transparent transition hover:border-ink hover:bg-ink hover:text-white'
          : 'flex h-14 w-full items-center justify-center gap-3 rounded-full bg-ink px-7 font-semibold text-white transition hover:bg-accent disabled:opacity-60'
      }
    >
      {icon ?? <ShoppingBag size={18} />}
      {!compact && (product.quantity < 1 ? 'Out of stock' : 'Add to cart')}
    </button>
  );
}
