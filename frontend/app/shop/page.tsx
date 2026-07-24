'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { PaginatedProducts } from '@/lib/types';
import { demoProducts } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';

const categories = ['', 'MOBILE', 'LAPTOP', 'TABLET', 'AUDIO', 'WATCH', 'ACCESSORY'];

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-[70vh] max-w-7xl px-5 py-16 lg:px-8">
          <div className="h-20 w-2/3 animate-pulse rounded-3xl bg-black/5" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState('newest');
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: '1', limit: '24', sort });
    if (category) params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [category, search, sort]);
  const products = useQuery({
    queryKey: ['products', query],
    queryFn: () => apiFetch<PaginatedProducts>(`/products?${query}`),
  });
  const list = products.data?.data ?? (products.isError ? demoProducts : []);

  return (
    <div className="mx-auto min-h-[70vh] max-w-7xl px-5 py-16 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          The collection
        </p>
        <h1 className="display mt-3 text-6xl sm:text-7xl">Find your next device.</h1>
        <p className="mt-5 max-w-xl leading-7 text-black/55">
          Compare carefully selected technology without the noise.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-y py-5 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border bg-white/50 px-4 py-3">
          <Search size={18} className="text-black/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or brand"
            className="w-full bg-transparent text-sm"
          />
        </label>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item || 'ALL'}
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold ${
                category === item ? 'bg-ink text-white' : 'border'
              }`}
            >
              {item || 'ALL'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <SlidersHorizontal size={17} />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="bg-transparent py-2 text-sm font-semibold"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name</option>
          </select>
        </label>
      </div>

      {products.isLoading ? (
        <div className="grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-[2rem] bg-black/5" />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid gap-x-6 gap-y-14 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-28 text-center">
          <p className="display text-4xl">No devices found.</p>
          <p className="mt-3 text-sm text-black/50">Try another search or category.</p>
        </div>
      )}
    </div>
  );
}
