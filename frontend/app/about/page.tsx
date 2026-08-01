import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - DeviceDock',
  description: 'Why DeviceDock is building a clearer way to choose technology.',
};

const principles = [
  {
    icon: ScanSearch,
    title: 'Clarity over clutter',
    text: 'Useful specifications and honest comparisons come before endless promotional noise.',
  },
  {
    icon: BadgeCheck,
    title: 'A considered catalog',
    text: 'The experience is designed around products that solve real everyday needs.',
  },
  {
    icon: HeartHandshake,
    title: 'Support with context',
    text: 'Good service helps before a purchase and continues after the decision is made.',
  },
];

export default function Page() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink px-5 py-24 text-white sm:py-32 lg:px-8">
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
            About DeviceDock
          </p>
          <h1 className="display mt-6 max-w-5xl text-6xl leading-[0.92] sm:text-7xl lg:text-8xl">
            Technology should make life clearer.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/55">
            DeviceDock is a Bangladesh-focused storefront concept built to make
            product discovery calmer, information easier to trust and account
            management straightforward.
          </p>
        </div>
      </section>

      <section className="mx-auto grid gap-12 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Our point of view
          </p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">
            The best choice is an informed one.
          </h2>
        </div>
        <div className="space-y-6 text-base leading-8 text-black/55">
          <p>
            Buying a device often means navigating unclear specifications,
            aggressive promotion and too many near-identical options. DeviceDock
            turns that experience into a focused collection with consistent
            information.
          </p>
          <p>
            The product is being built in deliberate phases. Discovery,
            accounts, profile management, cart and catalog operations are
            available now; ordering and payment will follow when their backend
            contracts are ready.
          </p>
        </div>
      </section>

      <section className="bg-[#ded7c7] px-5 py-24 lg:px-8">
        <div className="mx-auto">
          <div className="grid gap-5 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="rounded-[2rem] border bg-paper/70 p-7 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
                    <Icon size={21} />
                  </span>
                  <span className="text-xs text-black/30">0{index + 1}</span>
                </div>
                <h3 className="display mt-16 text-3xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-black/50">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto px-5 py-24 lg:px-8">
        <div className="flex flex-col justify-between gap-8 rounded-[2.5rem] bg-ink p-8 text-white sm:p-12 lg:flex-row lg:items-end">
          <div>
            <ShieldCheck className="text-accent" />
            <h2 className="display mt-6 text-5xl">
              See the approach in action.
            </h2>
            <p className="mt-4 max-w-xl text-white/50">
              Explore how discovery, accounts and cart work together today.
            </p>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-bold text-ink"
          >
            How DeviceDock works <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
