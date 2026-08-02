"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/api";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImageFallback } from "./product-image-fallback";
import { AddToWishlistButton } from "./add-to-wishlist-button";

const categoryTone: Record<Product["category"], string> = {
  MOBILE: "from-[#f5e4de] to-[#dfb9aa]",
  LAPTOP: "from-[#e2e8f0] to-[#b9c5d4]",
  TABLET: "from-[#f6e6de] to-[#dfc0b2]",
  AUDIO: "from-[#e7e7e5] to-[#c4c5c1]",
  WATCH: "from-[#e4eee7] to-[#b7ceb9]",
  ACCESSORY: "from-[#ece5f1] to-[#cdbbd8]",
};

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]?.url;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <article className="group relative min-w-0">
      <Link
        href={`/products/${product.id}`}
        className={`relative block aspect-[4/4.2] overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${categoryTone[product.category]}`}
      >
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <ProductImageFallback category={product.category} />
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {discount && (
            <span className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold text-white">
              −{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold backdrop-blur">
              <Sparkles size={11} /> Featured
            </span>
          )}
        </div>
        <span className="absolute right-4 top-4 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={17} />
        </span>
      </Link>
      <AddToWishlistButton productId={product.id} />
      <div className="pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/40">
          {product.brand} · {product.category}
        </p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${product.id}`}>
              <h3 className="truncate text-base font-bold tracking-[-0.02em] transition group-hover:text-accent">
                {product.title}
              </h3>
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-bold">{money(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-black/35 line-through">
                  {money(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
          <AddToCartButton
            product={product}
            compact
            icon={<ShoppingBag size={16} />}
          />
        </div>
      </div>
    </article>
  );
}
