'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, money } from '@/lib/api';
import type { PaginatedProducts } from '@/lib/types';

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const query = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () =>
      apiFetch<PaginatedProducts>(
        '/products?page=1&limit=100',
        {},
        accessToken,
      ),
    enabled: !!accessToken,
  });
  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
        Inventory desk
      </p>
      <h1 className="display mt-2 text-6xl">Catalog.</h1>
      <div className="mt-9 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        {query.isLoading ? (
          <div className="grid min-h-72 place-items-center">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {query.data?.data.map((product) => (
              <Link
                href={`/products/${product.id}`}
                key={product.id}
                className="grid gap-3 p-5 hover:bg-white sm:grid-cols-[1fr_130px_130px_40px] sm:items-center sm:px-7"
              >
                <div>
                  <p className="font-bold">{product.title}</p>
                  <p className="text-xs text-black/40">
                    {product.sku} · {product.brand}
                  </p>
                </div>
                <p className="text-sm">{money(product.price)}</p>
                <p
                  className={`text-sm font-semibold ${product.quantity < 5 ? 'text-red-600' : ''}`}
                >
                  {product.quantity} in stock
                </p>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
