import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CircleHelp,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact — DeviceDock',
  description:
    'Find the right DeviceDock support route for products, accounts and orders.',
};

const channels = [
  {
    icon: ShoppingBag,
    title: 'Product advice',
    text: 'Browse the live catalog, compare specifications and check current stock.',
    href: '/shop',
    action: 'Explore products',
  },
  {
    icon: ShieldCheck,
    title: 'Account help',
    text: 'Review profile, personal information and account security options.',
    href: '/account/security',
    action: 'Open account security',
  },
  {
    icon: Package,
    title: 'Order support',
    text: 'Order support will become available with the checkout and fulfilment release.',
    href: '/account/orders',
    action: 'View order status',
  },
];

export default function Page() {
  return (
    <>
      <section className="overflow-hidden bg-ink px-5 py-24 text-white sm:py-32 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
              Contact & support
            </p>
            <h1 className="display mt-5 text-6xl leading-[0.93] sm:text-7xl">
              Start with the right conversation.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
              Find product guidance, account help and clear information about
              features still being prepared.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <MapPin className="text-accent" />
            <p className="mt-5 font-bold">Built for Bangladesh</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              DeviceDock is currently an online-first storefront. Public phone,
              email and physical service-point details will be shown only when
              real support channels are active.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {channels.map(({ icon: Icon, title, text, href, action }) => (
            <article
              key={title}
              className="group rounded-[2rem] border bg-white/55 p-7 shadow-soft transition hover:-translate-y-1 hover:bg-white"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
                <Icon size={20} />
              </span>
              <h2 className="display mt-14 text-3xl">{title}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-black/50">
                {text}
              </p>
              <Link
                href={href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
              >
                {action}{' '}
                <ArrowRight
                  className="transition group-hover:translate-x-1"
                  size={16}
                />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#ded7c7] px-5 py-24 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <CircleHelp size={28} />
            <h2 className="display mt-5 text-5xl">
              Want to understand the journey first?
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-black/50">
              See what works today and what will arrive with future backend
              releases.
            </p>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-white"
          >
            How it works <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
