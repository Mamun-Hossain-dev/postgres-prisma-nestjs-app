'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { apiFetch, money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { demoProducts } from '@/lib/demo-products';
import { AddToCartButton } from '@/components/add-to-cart-button';

export default function ProductPage({ params }: { params: { id: string } }) {
  const [quantity, setQuantity] = useState(1);
  const productQuery = useQuery({
    queryKey: ['product', params.id],
    queryFn: () => apiFetch<Product>(`/products/${params.id}`),
  });
  const product =
    productQuery.data ??
    (productQuery.isError
      ? demoProducts.find((item) => item.id === Number(params.id))
      : undefined);

  if (!product) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-7xl px-5 py-20">
        <div className="h-[34rem] animate-pulse rounded-[2rem] bg-black/5" />
      </div>
    );
  }

  const image = product.images[0]?.url;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
      <Link href="/shop" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold">
        <ChevronLeft size={17} /> Back to collection
      </Link>
      <div className="grid gap-12 lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d8d0c0] to-[#898276]">
          {image ? (
            <Image src={image} alt={product.title} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-3/5 w-2/5 rotate-6 rounded-[3rem] border-2 border-white/40 bg-ink shadow-2xl">
                <div className="m-3 h-[calc(100%-1.5rem)] rounded-[2.4rem] bg-gradient-to-br from-[#372e2a] to-black" />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {product.brand} · {product.category}
          </p>
          <h1 className="display mt-4 text-6xl leading-none">{product.title}</h1>
          <p className="mt-5 text-lg leading-8 text-black/55">
            {product.shortDescription ?? product.description}
          </p>
          <div className="mt-7 flex items-center gap-3">
            <span className="text-2xl font-bold">{money(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-black/35 line-through">
                {money(product.compareAtPrice)}
              </span>
            )}
          </div>
          <div className="my-8 h-px bg-black/10" />
          <p className="mb-3 text-xs font-bold uppercase tracking-wider">Quantity</p>
          <div className="mb-5 flex w-36 items-center justify-between rounded-full border bg-white/40 p-1">
            <button
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white"
            >
              <Minus size={16} />
            </button>
            <span className="font-bold">{quantity}</span>
            <button
              onClick={() =>
                setQuantity((value) => Math.min(product.quantity, value + 1))
              }
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white"
            >
              <Plus size={16} />
            </button>
          </div>
          <AddToCartButton productId={product.id} quantity={quantity} />
          <div className="mt-7 grid gap-3 text-sm text-black/60 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <ShieldCheck size={18} /> Authenticity guaranteed
            </p>
            <p className="flex items-center gap-2">
              <Truck size={18} /> Delivery across Bangladesh
            </p>
          </div>
        </div>
      </div>

      <section className="mt-24 grid gap-10 border-t pt-14 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">
            The details
          </p>
          <h2 className="display mt-3 text-4xl">Made to fit your day.</h2>
          <p className="mt-5 max-w-xl leading-7 text-black/55">{product.description}</p>
        </div>
        <div className="divide-y border-y">
          {Object.entries(product.specifications ?? {}).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-6 py-4 text-sm">
              <span className="text-black/45">{key}</span>
              <span className="text-right font-semibold">{String(value)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
