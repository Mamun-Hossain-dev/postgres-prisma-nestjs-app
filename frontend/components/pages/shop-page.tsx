'use client';

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent, Search, SlidersHorizontal } from 'lucide-react';
import { demoProducts } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { productListQueryOptions } from '@/lib/queries/products';

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
        <div className="min-h-[70vh] px-5 py-16 lg:px-8">
          <div className="h-20 w-2/3 animate-pulse rounded-3xl bg-black/5" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const featuredOnly = searchParams.get('featured') === 'true';
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCategory(searchParams.get('category') ?? '');
    setPage(1);
  }, [searchParams]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      sort,
    });
    if (category) params.set('category', category);
    if (deferredSearch.trim()) params.set('search', deferredSearch.trim());
    if (featuredOnly) params.set('featured', 'true');
    if (appliedMinPrice) params.set('minPrice', appliedMinPrice);
    if (appliedMaxPrice) params.set('maxPrice', appliedMaxPrice);
    if (onSale) params.set('onSale', 'true');
    return params.toString();
  }, [
    category,
    deferredSearch,
    featuredOnly,
    appliedMaxPrice,
    appliedMinPrice,
    onSale,
    page,
    sort,
  ]);
  const products = useQuery(productListQueryOptions(query));
  const list = products.data?.data ?? (products.isError ? demoProducts : []);

  return (
    <div className="min-h-[70vh] px-5 py-16 lg:px-8">
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

      <form
        className="mt-5 flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedMinPrice(minPrice);
          setAppliedMaxPrice(maxPrice);
          setPage(1);
        }}
      >
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Min price"
          aria-label="Minimum price"
          className="h-12 w-40 rounded-full border bg-white/70 px-5 text-sm transition-all duration-200 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 sm:w-44"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Max price"
          aria-label="Maximum price"
          className="h-12 w-40 rounded-full border bg-white/70 px-5 text-sm transition-all duration-200 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 sm:w-44"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md active:translate-y-0"
        >
          <SlidersHorizontal size={15} /> Apply filters
        </button>
        <button
          type="button"
          onClick={() => {
            setOnSale((value) => !value);
            setPage(1);
          }}
          aria-pressed={onSale}
          className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-xs font-bold transition-all duration-200 ${
            onSale
              ? 'bg-accent text-white shadow-sm'
              : 'border bg-white/70 hover:border-accent/40 hover:bg-white'
          }`}
        >
          <BadgePercent size={15} /> On sale
        </button>
      </form>

      <div className="mt-14 flex flex-col gap-4 border-y py-5 transition-colors duration-300 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border bg-white/60 px-4 py-3 transition-all duration-200 focus-within:border-accent focus-within:bg-white focus-within:ring-4 focus-within:ring-accent/10">
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
                const params = new URLSearchParams(searchParams.toString());
                if (item) params.set('category', item);
                else params.delete('category');
                const queryString = params.toString();
                router.replace(queryString ? `/shop?${queryString}` : '/shop', {
                  scroll: false,
                });
              }}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                category === item
                  ? 'bg-ink text-white shadow-sm'
                  : 'border hover:border-accent/40 hover:bg-white'
              }`}
            >
              {item || 'ALL'}
            </button>
          ))}
        </div>
        <div className="flex w-full lg:w-auto">
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            options={sortOptions}
            ariaLabel="Sort products"
            className="w-full border-accent/30 bg-accent/10 text-accent shadow-sm hover:bg-accent/15 lg:w-auto"
          />
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid animate-in gap-6 py-12 fade-in sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-[2rem] bg-black/5"
            />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid animate-in gap-x-6 gap-y-14 py-12 fade-in duration-300 sm:grid-cols-2 lg:grid-cols-4">
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
