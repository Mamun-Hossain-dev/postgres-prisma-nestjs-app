'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/api';
import { AddToCartButton } from './add-to-cart-button';

const categoryTone: Record<Product['category'], string> = {
  MOBILE: 'from-[#d9cdbd] to-[#a9a095]',
  LAPTOP: 'from-[#b8c1bf] to-[#6e7979]',
  TABLET: 'from-[#d7b4a0] to-[#966f60]',
  AUDIO: 'from-[#b8b4ac] to-[#716e67]',
  WATCH: 'from-[#c9bda3] to-[#85755c]',
  ACCESSORY: 'from-[#bfc5af] to-[#748069]',
};

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]?.url;

  return (
    <article className="group">
      <Link
        href={`/products/${product.id}`}
        className={`relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br ${categoryTone[product.category]}`}
      >
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-44 w-32 rotate-6 items-center justify-center rounded-[2rem] border border-white/60 bg-ink/90 shadow-2xl transition duration-700 group-hover:rotate-0 group-hover:scale-105">
              <span className="display -rotate-90 text-2xl text-white/25">
                {product.category}
              </span>
            </div>
          </div>
        )}
        <span className="absolute left-5 top-5 rounded-full bg-paper/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
          {product.brand}
        </span>
        <span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <div className="flex items-start justify-between gap-4 px-1 pt-5">
        <div>
          <Link href={`/products/${product.id}`}>
            <h3 className="display text-2xl font-semibold">{product.title}</h3>
          </Link>
          <p className="mt-1 text-sm text-black/55">{money(product.price)}</p>
        </div>
        <AddToCartButton
          productId={product.id}
          compact
          icon={<ShoppingBag size={17} />}
        />
      </div>
    </article>
  );
}
