'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, Headphones, Truck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { PaginatedProducts } from '@/lib/types';
import { demoProducts } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';

const categories = [
  { label: 'Smartphones', value: 'MOBILE', number: '01' },
  { label: 'Laptops', value: 'LAPTOP', number: '02' },
  { label: 'Tablets', value: 'TABLET', number: '03' },
  { label: 'Audio', value: 'AUDIO', number: '04' },
];

export default function HomePage() {
  const products = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () =>
      apiFetch<PaginatedProducts>('/products?featured=true&limit=8&page=1'),
  });
  const featured = products.data?.data.length
    ? products.data.data
    : demoProducts;

  return (
    <>
      <section className="grain relative min-h-[calc(100vh-5rem)] overflow-hidden bg-ink text-white">
        <Image
          src="/images/gadget-hero.png"
          alt="A curated collection of modern gadgets"
          fill
          priority
          className="object-cover object-[62%_center] opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-transparent" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-5 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/65">
              <span className="h-px w-10 bg-accent" />
              Technology, thoughtfully selected
            </p>
            <h1 className="display text-6xl font-medium leading-[0.92] sm:text-7xl lg:text-[6.4rem]">
              Better devices.
              <br />
              <em className="font-normal text-[#dec6ae]">Clearer choices.</em>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/65 sm:text-lg">
              Phones, computers and everyday technology curated for how you
              actually live and work.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="flex items-center gap-3 rounded-full bg-accent px-7 py-4 font-semibold transition hover:bg-white hover:text-ink"
              >
                Explore the collection <ArrowRight size={18} />
              </Link>
              <Link
                href="/shop?featured=true"
                className="rounded-full border border-white/25 px-7 py-4 font-semibold backdrop-blur hover:bg-white/10"
              >
                Shop featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl divide-y px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            [Truck, 'Fast delivery', 'Across Bangladesh'],
            [BadgeCheck, 'Authentic devices', 'Official warranty'],
            [Headphones, 'Real support', 'Before and after purchase'],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Truck;
            return (
              <div key={String(title)} className="flex items-center gap-4 py-7 sm:px-7">
                <FeatureIcon size={23} strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-bold">{String(title)}</p>
                  <p className="text-xs text-black/50">{String(text)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Freshly docked
            </p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">Worth your attention.</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 text-sm font-bold sm:flex">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-[#ded7c7] px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/45">
              Find your department
            </p>
            <h2 className="display mt-3 text-5xl">Start with what matters.</h2>
          </div>
          <div className="grid border-y sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={`/shop?category=${category.value}`}
                className="group border-b p-6 transition hover:bg-paper sm:border-r lg:border-b-0"
              >
                <span className="text-xs text-black/40">{category.number}</span>
                <div className="mt-20 flex items-end justify-between">
                  <span className="display text-3xl">{category.label}</span>
                  <ArrowRight className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
