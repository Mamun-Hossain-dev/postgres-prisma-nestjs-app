'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Boxes,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch, money } from '@/lib/api';
import type { PaginatedProducts, PaginatedUsers } from '@/lib/types';

export default function AdminOverviewPage() {
  const { accessToken, user } = useAuth();
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () =>
      apiFetch<PaginatedUsers>('/users?page=1&limit=100', {}, accessToken),
    enabled: !!accessToken,
  });
  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () =>
      apiFetch<PaginatedProducts>(
        '/products?page=1&limit=100',
        {},
        accessToken,
      ),
    enabled: !!accessToken,
  });
  const productList = products.data?.data ?? [];
  const inventoryValue = productList.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <main>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Live operations
          </p>
          <h1 className="display mt-2 text-6xl">
            Good day, {user?.name.split(' ')[0]}.
          </h1>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/55 px-4 py-2 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Systems
          online
        </span>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<UsersRound />}
          label="Customers"
          value={String(users.data?.meta.totalItems ?? 0)}
        />
        <Metric
          icon={<Boxes />}
          label="Products"
          value={String(products.data?.meta.totalItems ?? 0)}
        />
        <Metric
          icon={<Sparkles />}
          label="Featured"
          value={String(productList.filter((p) => p.isFeatured).length)}
        />
        <Metric
          icon={<ShieldCheck />}
          label="Inventory value"
          value={money(inventoryValue)}
        />
      </div>
      <section className="mt-7 rounded-[2rem] bg-ink p-7 text-white sm:p-9">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Catalog pulse
            </p>
            <h2 className="display mt-2 text-4xl">
              Products needing attention.
            </h2>
          </div>
          <Link
            href="/admin/products"
            className="hidden items-center gap-2 text-sm font-bold sm:flex"
          >
            View catalog <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-8 divide-y divide-white/10">
          {productList.slice(0, 5).map((product) => (
            <Link
              href={`/products/${product.id}`}
              key={product.id}
              className="grid grid-cols-[1fr_auto] gap-5 py-4"
            >
              <div>
                <p className="font-semibold">{product.title}</p>
                <p className="mt-1 text-xs text-white/40">
                  {product.brand} · {product.category}
                </p>
              </div>
              <p
                className={
                  product.quantity < 5 ? 'text-accent' : 'text-white/65'
                }
              >
                {product.quantity} in stock
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.75rem] border bg-white/55 p-6 shadow-soft">
      <span className="text-accent">{icon}</span>
      <p className="mt-8 text-xs font-bold uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className="display mt-1 text-3xl">{value}</p>
    </div>
  );
}
