'use client';

import { Suspense, useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { PaginatedProducts } from '@/lib/types';
import { demoProducts } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';

const categories = [
  '',
  'MOBILE',
  'LAPTOP',
  'TABLET',
  'AUDIO',
  'WATCH',
  'ACCESSORY',
];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name' },
];

export function ShopPage() {
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
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const featuredOnly = searchParams.get('featured') === 'true';
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      sort,
    });
    if (category) params.set('category', category);
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
    if (featuredOnly) params.set('featured', 'true');
    return params.toString();
  }, [category, deferredSearch, featuredOnly, page, sort]);
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
        <h1 className="display mt-3 text-6xl sm:text-7xl">
          Find your next device.
        </h1>
        <p className="mt-5 max-w-xl leading-7 text-black/55">
          Compare carefully selected technology without the noise.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-y py-5 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border bg-white/50 px-4 py-3">
          <Search size={18} className="text-black/40" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search product or brand"
            className="w-full bg-transparent text-sm"
          />
        </label>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item || 'ALL'}
              onClick={() => {
                setCategory(item);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold ${
                category === item ? 'bg-ink text-white' : 'border'
              }`}
            >
              {item || 'ALL'}
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <SlidersHorizontal size={17} />
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            options={sortOptions}
            ariaLabel="Sort products"
            className="w-full border-0 bg-transparent lg:w-auto"
          />
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-[2rem] bg-black/5"
            />
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
          <p className="mt-3 text-sm text-black/50">
            Try another search or category.
          </p>
        </div>
      )}
      {products.data?.meta && (
        <Pagination
          page={products.data.meta.page}
          totalPages={products.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
