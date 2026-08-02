"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { money } from "@/lib/api";
import { demoProducts } from "@/lib/demo-products";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductImageFallback } from "@/components/product-image-fallback";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import {
  productDetailQueryOptions,
  relatedProductsQueryOptions,
} from "@/lib/queries/products";

export function ProductPage({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const productQuery = useQuery(productDetailQueryOptions(productId));
  const product =
    productQuery.data ??
    (productQuery.isError
      ? demoProducts.find((item) => item.id === Number(productId))
      : undefined);
  const relatedQuery = useQuery(
    relatedProductsQueryOptions(product?.category, productId),
  );

  useEffect(() => setActiveImage(0), [productId]);

  if (!product) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-[1380px] px-5 py-10 lg:px-8">
        <Skeleton className="h-4 w-36" />
        <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,560px)_1fr] xl:gap-14">
          <div>
            <Skeleton className="aspect-square rounded-[2.5rem]" />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="pt-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-6 h-16 w-4/5 rounded-2xl" />
            <Skeleton className="mt-6 h-5 w-full" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-8 h-32 w-full rounded-3xl" />
            <Skeleton className="mt-8 h-8 w-32" />
          </div>
        </div>
      </div>
    );
  }

  const images = product.images.slice(0, 4);
  const image = images[activeImage]?.url;
  const relatedProducts = (relatedQuery.data?.data ?? [])
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const showPreviousImage = () =>
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  const showNextImage = () =>
    setActiveImage((current) => (current + 1) % images.length);

  return (
    <div className="mx-auto max-w-[1380px] px-5 py-8 lg:px-8 lg:py-10">
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold"
      >
        <ChevronLeft size={17} /> Back to collection
      </Link>
      <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,560px)_1fr] xl:gap-14">
        <div className="w-full max-w-[560px]">
          <div className="group relative aspect-square overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d8d0c0] to-[#898276]">
            {image ? (
              <Image
                src={image}
                alt={`${product.title} view ${activeImage + 1}`}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                priority
              />
            ) : (
              <ProductImageFallback category={product.category} />
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-lg backdrop-blur transition hover:bg-white"
                  aria-label="Previous product image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-lg backdrop-blur transition hover:bg-white"
                  aria-label="Next product image"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">
                  {activeImage + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white/40 transition ${
                    activeImage === index
                      ? "border-accent shadow-md"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                  aria-label={`Show product image ${index + 1}`}
                  aria-current={activeImage === index}
                >
                  <Image src={item.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pt-1 lg:pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {product.brand} · {product.category}
          </p>
          <h1 className="display mt-4 text-6xl leading-none">
            {product.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-black/55">
            {product.shortDescription ?? product.description}
          </p>
          {product.shortDescription && (
            <div className="mt-7 rounded-[1.5rem] border bg-white/35 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                Description
              </p>
              <p className="mt-3 whitespace-pre-line leading-7 text-black/60">
                {product.description}
              </p>
            </div>
          )}
          <div className="mt-7 flex items-center gap-3">
            <span className="text-2xl font-bold">{money(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-base text-black/35 line-through">
                {money(product.compareAtPrice)}
              </span>
            )}
          </div>
          <div className="my-8 h-px bg-black/10" />
          <p className="mb-3 text-xs font-bold uppercase tracking-wider">
            Quantity
          </p>
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
          <AddToCartButton product={product} quantity={quantity} />
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

      {Object.keys(product.specifications ?? {}).length > 0 && (
        <section className="mt-24 border-t pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">
            Specifications
          </p>
          <h2 className="display mt-3 text-4xl">Product details.</h2>
          <div className="mt-8 divide-y border-y">
            {Object.entries(product.specifications ?? {}).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-6 py-4 text-sm"
                >
                  <span className="text-black/45">{key}</span>
                  <span className="text-right font-semibold">
                    {String(value)}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {(relatedQuery.isLoading || relatedProducts.length > 0) && (
        <section className="mt-20 border-t pt-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                You may also like
              </p>
              <h2 className="display mt-3 text-4xl">Relevant products.</h2>
              <p className="mt-3 text-sm text-black/45">
                More products from the {product.category.toLowerCase()}{" "}
                collection.
              </p>
            </div>
            <Link
              href={`/shop?category=${product.category}`}
              className="rounded-full border px-5 py-3 text-sm font-bold transition hover:bg-ink hover:text-white"
            >
              View collection
            </Link>
          </div>
          <div className="mt-8">
            {relatedQuery.isLoading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
