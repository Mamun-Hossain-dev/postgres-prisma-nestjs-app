'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgeCheck,
  Cable,
  Check,
  ChevronRight,
  Headphones,
  Headset,
  Laptop,
  Quote,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Truck,
  Watch,
  Zap,
} from 'lucide-react';
import { apiFetch, money } from '@/lib/api';
import type {
  NewsletterSubscriber,
  Product,
  ProductCollections,
} from '@/lib/types';
import { demoProducts } from '@/lib/demo-products';
import { ProductCard } from '@/components/product-card';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { homeProductCollectionsQueryOptions } from '@/lib/queries/products';

const categories = [
  {
    label: 'Smartphones',
    value: 'MOBILE',
    icon: Smartphone,
    tone: 'from-[#f6e5df] to-[#e0b7a7]',
  },
  {
    label: 'Laptops',
    value: 'LAPTOP',
    icon: Laptop,
    tone: 'from-[#dce7f1] to-[#b4c8d9]',
  },
  {
    label: 'Tablets',
    value: 'TABLET',
    icon: Tablet,
    tone: 'from-[#f5e1d7] to-[#dfbca9]',
  },
  {
    label: 'Audio',
    value: 'AUDIO',
    icon: Headphones,
    tone: 'from-[#e7e7e5] to-[#c2c4bf]',
  },
  {
    label: 'Wearables',
    value: 'WATCH',
    icon: Watch,
    tone: 'from-[#dceadc] to-[#afc9b0]',
  },
  {
    label: 'Accessories',
    value: 'ACCESSORY',
    icon: Cable,
    tone: 'from-[#ebe1f0] to-[#cbb8d5]',
  },
];

const faqs = [
  [
    'Are the products connected to the real catalog?',
    'Yes. DeviceDock loads products, pricing, stock and specifications from the NestJS backend. Local demo products appear only when that API is unavailable.',
  ],
  [
    'Does my cart stay with my account?',
    'Yes. Signed-in carts are stored through the backend, so quantities and selected products are restored with your account.',
  ],
  [
    'Can I place and pay for an order now?',
    'Not yet. Checkout, orders and payment are intentionally disabled until their secure backend workflows are complete.',
  ],
  [
    'Where does DeviceDock deliver?',
    'The storefront is designed for delivery across Bangladesh. Exact delivery zones and fees will be shown when checkout is released.',
  ],
];

export function HomePage() {
  const productsQuery = useQuery(homeProductCollectionsQueryOptions());
  const fallbackCollections: ProductCollections = {
    featured: demoProducts.filter((product) => product.isFeatured),
    newArrivals: demoProducts,
    offers: demoProducts.filter(
      (product) =>
        product.compareAtPrice && product.compareAtPrice > product.price,
    ),
    bestSellers: demoProducts.filter((product) => product.isBestSeller),
    trending: demoProducts.filter((product) => product.isTrending),
    brands: Array.from(new Set(demoProducts.map((product) => product.brand))),
  };
  const collections = productsQuery.data ?? fallbackCollections;
  const featuredProducts = (
    collections.featured.length ? collections.featured : collections.newArrivals
  ).slice(0, 4);
  const offer = collections.offers[0];
  const newest = collections.newArrivals.slice(0, 5);
  const bestSellers = (
    collections.bestSellers.length
      ? collections.bestSellers
      : collections.newArrivals
  ).slice(0, 4);
  const trending = (
    collections.trending.length ? collections.trending : collections.featured
  ).slice(0, 3);
  const brands = collections.brands;

  return (
    <>
      <Hero />

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x px-5 sm:grid-cols-4 lg:px-8">
          {[
            [Truck, 'Fast delivery', 'Selected products'],
            [ShieldCheck, 'Secure account', 'Protected sessions'],
            [BadgeCheck, 'Clear product data', 'Real stock & pricing'],
            [Headset, 'Helpful support', 'Before and after'],
          ].map(([Icon, title, text]) => {
            const BenefitIcon = Icon as typeof Truck;
            return (
              <div
                key={String(title)}
                className="flex items-center gap-3 px-3 py-5 sm:px-5"
              >
                <BenefitIcon size={19} className="shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-bold">{String(title)}</p>
                  <p className="mt-0.5 hidden text-[11px] text-black/40 sm:block">
                    {String(text)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Shop by category"
          title="Find the tech that fits."
          intro="Jump straight into the devices you care about."
          href="/shop"
          action="View all"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ label, value, icon: Icon, tone }) => (
            <Link
              key={value}
              href={`/shop?category=${value}`}
              className={`group relative min-h-48 overflow-hidden rounded-[1.5rem] bg-gradient-to-br p-5 ${tone}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 backdrop-blur">
                <Icon size={19} />
              </span>
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                <div>
                  <p className="text-base font-bold tracking-[-0.02em]">
                    {label}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-black/45">
                    Shop collection
                  </p>
                </div>
                <ChevronRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeading
            eyebrow="Featured products"
            title="The devices to know now."
            intro="Standout products selected from the live catalog."
            href="/shop?featured=true"
            action="Shop featured"
          />
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {offer && <LimitedOffer product={offer} />}

      <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Best sellers"
          title="Popular picks, ready to explore."
          intro="Featured catalog picks while verified sales ranking is being prepared."
          href="/shop"
          action="Browse everything"
        />
        <div className="mt-8 grid overflow-hidden rounded-[1.75rem] border bg-white md:grid-cols-2">
          {bestSellers.map((product, index) => (
            <CompactProduct
              key={product.id}
              product={product}
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-[#0b0b0e] px-5 py-16 text-white lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e58a63]">
                Trending now
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Built for what is next.
              </h2>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"
            >
              See all products <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {trending.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group relative min-h-80 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-6"
              >
                <span className="text-xs font-bold text-white/30">
                  0{index + 1}
                </span>
                <div className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full border border-white/10 transition group-hover:bg-white group-hover:text-ink">
                  <ArrowRight size={15} />
                </div>
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e58a63]">
                    {product.brand}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.035em]">
                    {product.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/45">
                    {product.shortDescription ?? product.description}
                  </p>
                  <p className="mt-5 font-bold">{money(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              New arrivals
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
              Fresh from the catalog.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-black/50">
              The newest products available from the backend, ordered by release
              into the store.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              Shop new arrivals <ArrowRight size={15} />
            </Link>
          </div>
          <div className="divide-y rounded-[1.75rem] border">
            {newest.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group grid grid-cols-[36px_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-black/[0.025]"
              >
                <span className="text-xs font-bold text-black/25">
                  0{index + 1}
                </span>
                <div>
                  <p className="font-bold tracking-[-0.02em]">
                    {product.title}
                  </p>
                  <p className="mt-1 text-xs text-black/40">
                    {product.brand} · {product.category}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm font-bold sm:block">
                    {money(product.price)}
                  </span>
                  <ChevronRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="rounded-[2rem] border bg-gradient-to-br from-[#f7e7e1] via-white to-[#f4f4f6] p-7 sm:p-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-black/35">
            Popular brands in the catalog
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/shop?search=${encodeURIComponent(brand)}`}
                className="rounded-full border bg-white px-6 py-3 text-sm font-extrabold tracking-[-0.02em] shadow-sm transition hover:-translate-y-0.5 hover:border-accent"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <ReviewsReady />
      <NewsletterReady />
      <Faq />
    </>
  );
}

function Hero() {
  return (
    <section className="bg-white px-3 pb-3 pt-3 sm:px-5 sm:pb-5 lg:px-8">
      <div className="relative mx-auto min-h-[560px] max-w-[1440px] overflow-hidden rounded-[1.75rem] bg-[#0c0d10] text-white sm:min-h-[620px]">
        <Image
          src="/images/gadget-hero.png"
          alt="Premium electronics available at DeviceDock"
          fill
          priority
          className="object-cover object-[68%_center] opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(180,71,47,.28),transparent_32%)]" />
        <div className="relative flex min-h-[560px] items-center px-6 py-16 sm:min-h-[620px] sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-bold backdrop-blur">
              <Zap size={13} className="text-[#ef9b75]" /> Premium tech. Clear
              choices.
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Upgrade the way
              <br />
              you live and work.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
              Discover phones, laptops, audio and everyday technology with real
              pricing, live stock and clear specifications.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-[#f4ded5]"
              >
                Shop all products <ArrowRight size={16} />
              </Link>
              <Link
                href="/shop?featured=true"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold backdrop-blur transition hover:bg-white/10"
              >
                Explore featured
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-white/45">
              {[
                'Authentic product data',
                'Secure accounts',
                'Cart saved to backend',
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check size={13} className="text-[#ef9b75]" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LimitedOffer({ product }: { product: Product }) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;
  return (
    <section id="offers" className="px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#762d36] via-[#a83d32] to-[#d46a36] text-white lg:grid-cols-[1fr_0.8fr]">
        <div className="p-8 sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
            <Sparkles size={13} /> Limited offer
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
            {product.title}
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-white/70">
            {product.shortDescription ?? product.description}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="text-2xl font-bold">{money(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-white/45 line-through">
                {money(product.compareAtPrice)}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-accent">
                Save {discount}%
              </span>
            )}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/products/${product.id}`}
              className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink"
            >
              View offer
            </Link>
            <div className="[&_button]:border-white/20 [&_button]:bg-white/10">
              <AddToCartButton productId={product.id} compact={false} />
            </div>
          </div>
        </div>
        <div className="relative min-h-72 bg-white/10">
          {product.images[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-48 w-36 rotate-6 rounded-[2rem] border border-white/30 bg-[#111214] shadow-2xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CompactProduct({ product, rank }: { product: Product; rank: number }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group grid grid-cols-[auto_80px_1fr_auto] items-center gap-4 border-b p-5 transition hover:bg-black/[0.025] md:odd:border-r"
    >
      <span className="text-xs font-extrabold text-black/20">0{rank}</span>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eceef2]">
        {product.images[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt=""
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-[28%] rotate-6 rounded-lg bg-ink" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold">{product.title}</p>
        <p className="mt-1 text-xs text-black/40">
          {product.brand} · {product.category}
        </p>
        <p className="mt-2 text-sm font-bold">{money(product.price)}</p>
      </div>
      <ChevronRight size={17} />
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-black/45">{intro}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-bold"
      >
        {action} <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function WhyChooseUs() {
  const items = [
    [
      ShieldCheck,
      'Secure by design',
      'JWT sessions, protected account routes and role-aware access.',
    ],
    [
      BadgeCheck,
      'Real catalog data',
      'Prices, availability and specifications come from the backend.',
    ],
    [
      RotateCcw,
      'Easy cart control',
      'Update quantities, remove items or clear the cart in a few taps.',
    ],
    [
      Headset,
      'Support-ready',
      'Clear routes for product, account and future order support.',
    ],
  ];
  return (
    <section className="bg-white px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Why choose DeviceDock
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
            Confidence at every click.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return (
              <article
                key={String(title)}
                className="rounded-[1.5rem] border bg-[#fafafa] p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7e7e1] text-accent">
                  <ItemIcon size={20} />
                </span>
                <h3 className="mt-7 font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-black/45">
                  {String(text)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReviewsReady() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-8">
      <div className="grid overflow-hidden rounded-[2rem] border bg-[#f0f0f2] lg:grid-cols-[0.8fr_1.2fr]">
        <div className="p-8 sm:p-10">
          <Quote className="text-accent" />
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-black/35">
            Customer reviews
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
            Only verified feedback belongs here.
          </h2>
        </div>
        <div className="flex items-center border-t border-black/10 bg-white/45 p-8 sm:p-10 lg:border-l lg:border-t-0">
          <div>
            <p className="font-bold">
              Verified reviews will launch with completed orders.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-black/50">
              The design is ready, but DeviceDock will not display invented
              testimonials. Customer feedback will appear after the order and
              review APIs can verify real purchases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterReady() {
  const [email, setEmail] = useState('');
  const subscribe = useMutation({
    mutationFn: (subscriberEmail: string) =>
      apiFetch<NewsletterSubscriber>('/newsletter/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email: subscriberEmail }),
      }),
    onSuccess: () => {
      setEmail('');
      toast.success('You are subscribed to DeviceDock updates');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail) subscribe.mutate(normalizedEmail);
  };

  return (
    <section className="px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-8 rounded-[2rem] bg-[#111216] p-8 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e58a63]">
            DeviceDock updates
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
            Be first to hear what docks next.
          </h2>
          <p className="mt-2 text-sm text-white/45">
            Product drops, limited offers and practical buying updates—sent only
            with your consent.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="flex w-full max-w-md rounded-full border border-white/10 bg-white/5 p-1.5"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-label="Newsletter email"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={subscribe.isPending}
            className="rounded-full bg-white px-5 py-3 text-xs font-bold text-ink disabled:opacity-50"
          >
            {subscribe.isPending ? 'Joining…' : 'Notify me'}
          </button>
        </form>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 lg:grid-cols-[0.65fr_1fr] lg:px-8 lg:py-20">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          FAQ
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.045em]">
          Good questions, clear answers.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-black/45">
          Everything you need to know about the current DeviceDock experience.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
        >
          Contact support <ArrowRight size={15} />
        </Link>
      </div>
      <div className="divide-y border-y">
        {faqs.map(([question, answer]) => (
          <details key={question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
              {question}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-lg transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pr-12 pt-3 text-sm leading-7 text-black/50">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
