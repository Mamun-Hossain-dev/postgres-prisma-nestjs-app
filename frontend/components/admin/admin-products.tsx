'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { apiFetch, money } from '@/lib/api';
import type { Category, PaginatedProducts, Product } from '@/lib/types';

const categories: Array<Category | ''> = [
  '',
  'MOBILE',
  'LAPTOP',
  'TABLET',
  'AUDIO',
  'WATCH',
  'ACCESSORY',
];

export function AdminProducts() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<Category | ''>('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    limit: '10',
    sort,
  });
  if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
  if (category) params.set('category', category);

  const query = useQuery({
    queryKey: ['admin', 'products', params.toString()],
    queryFn: () =>
      apiFetch<PaginatedProducts>(`/products?${params}`, {}, accessToken),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<null>(`/products/${id}`, { method: 'DELETE' }, accessToken),
    onSuccess: async () => {
      setDeleting(null);
      toast.success('Product deleted');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const products = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Inventory desk
          </p>
          <h1 className="display mt-2 text-5xl sm:text-6xl">Products.</h1>
          <p className="mt-3 text-sm text-black/50">
            Search, organize and maintain the DeviceDock catalog.
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="h-12">
            <Plus size={17} /> Add product
          </Button>
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_190px_190px]">
          <label className="flex items-center gap-3 rounded-xl border bg-white/70 px-3">
            <Search size={17} className="text-black/35" />
            <span className="sr-only">Search products</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, brand or SKU"
              className="h-11 w-full bg-transparent text-sm"
            />
          </label>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as Category | '');
              setPage(1);
            }}
            aria-label="Filter by category"
            className="h-11 rounded-xl border bg-white/70 px-3 text-sm"
          >
            {categories.map((item) => (
              <option key={item || 'all'} value={item}>
                {item || 'All categories'}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            aria-label="Sort products"
            className="h-11 rounded-xl border bg-white/70 px-3 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="price-asc">Lowest price</option>
            <option value="price-desc">Highest price</option>
          </select>
        </div>

        {query.isLoading ? (
          <ProductTableSkeleton />
        ) : query.isError ? (
          <EmptyState
            icon={<Boxes />}
            title="Catalog could not be loaded"
            description={query.error.message}
            action={
              <Button onClick={() => void query.refetch()}>Try again</Button>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Boxes />}
            title="No matching products"
            description="Change the filters or add your first product."
            action={
              <Link href="/admin/products/new">
                <Button>
                  <Plus size={17} /> Add product
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-black/[0.025] text-[11px] uppercase tracking-wider text-black/40">
                <tr>
                  <th className="px-5 py-4 font-bold">Product</th>
                  <th className="px-5 py-4 font-bold">Category</th>
                  <th className="px-5 py-4 font-bold">Price</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-white/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#d8d0c0]">
                          {product.images[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-[28%] rotate-6 rounded bg-ink" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="font-bold hover:text-accent"
                          >
                            {product.title}
                          </Link>
                          <p className="mt-1 text-xs text-black/40">
                            {product.sku} · {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="accent">{product.category}</Badge>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {money(product.price)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          product.quantity === 0
                            ? 'danger'
                            : product.quantity < 5
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {product.quantity === 0
                          ? 'Out of stock'
                          : `${product.quantity} in stock`}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {product.isFeatured ? (
                        <Badge tone="success">
                          <Star size={11} className="mr-1" /> Featured
                        </Badge>
                      ) : (
                        <Badge>Standard</Badge>
                      )}
                    </td>
                    <td className="relative px-5 py-4 text-right">
                      <button
                        onClick={() =>
                          setMenu(menu === product.id ? null : product.id)
                        }
                        className="rounded-xl p-2 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label={`Actions for ${product.title}`}
                        aria-expanded={menu === product.id}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      {menu === product.id && (
                        <div className="absolute right-5 top-12 z-20 w-44 rounded-2xl border bg-paper p-2 text-left shadow-xl">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-black/5"
                          >
                            <Pencil size={15} /> Edit product
                          </Link>
                          <button
                            onClick={() => {
                              setDeleting(product);
                              setMenu(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this product?"
        description={`“${deleting?.title ?? 'This product'}” and its uploaded images will be permanently removed.`}
        confirmLabel="Delete product"
        danger
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-black/5" />
          <div className="h-4 w-48 animate-pulse rounded bg-black/5" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-black/5" />
        </div>
      ))}
    </div>
  );
}
