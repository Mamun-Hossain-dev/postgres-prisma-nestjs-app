import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How it works — DeviceDock',
  description:
    'Discover how to find products, create an account and build your DeviceDock cart.',
};

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Find what fits',
    text: 'Search the catalog, filter by category and sort products by the criteria that matter to you.',
    points: [
      'Focused product collection',
      'Clear stock and BDT pricing',
      'Technical specifications',
    ],
  },
  {
    number: '02',
    icon: UserRound,
    title: 'Create your account',
    text: 'Sign in securely to keep a persistent cart and manage your identity from one account center.',
    points: [
      'Short-lived authenticated session',
      'Profile photo and personal details',
      'Protected account routes',
    ],
  },
  {
    number: '03',
    icon: ShoppingBag,
    title: 'Build your selection',
    text: 'Choose quantities, add products to your cart and return later without losing your shortlist.',
    points: [
      'Backend-synced cart',
      'Live quantity controls',
      'Clear subtotal summary',
    ],
  },
];

export default function Page() {
  return (
    <>
      <section className="px-5 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
            How it works
          </p>
          <h1 className="display mt-5 max-w-4xl text-6xl leading-[0.95] sm:text-7xl">
            From curiosity to a confident shortlist.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-black/50">
            DeviceDock keeps the current journey simple while checkout and
            payment are prepared for a later phase.
          </p>
        </div>
      </section>

      <section className="border-y bg-[#ded7c7] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, text, points }) => (
            <article
              key={number}
              className="flex flex-col rounded-[2rem] bg-paper p-7 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
                  <Icon size={20} />
                </span>
                <span className="display text-3xl text-black/20">{number}</span>
              </div>
              <h2 className="display mt-14 text-4xl">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-black/50">{text}</p>
              <ul className="mt-7 grid gap-3 border-t pt-6">
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3 text-sm font-semibold"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={12} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid overflow-hidden rounded-[2.5rem] bg-ink text-white lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Available now
            </p>
            <h2 className="display mt-4 text-5xl">
              Discovery, accounts and cart.
            </h2>
            <p className="mt-5 leading-7 text-white/50">
              These flows use the live backend and persist real application
              data.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-bold text-ink"
            >
              Start exploring <ArrowRight size={16} />
            </Link>
          </div>
          <div className="border-t border-white/10 bg-white/[0.04] p-8 sm:p-12 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
              Coming next
            </p>
            <h2 className="display mt-4 text-5xl text-white/80">
              Checkout, orders and payment.
            </h2>
            <p className="mt-5 leading-7 text-white/45">
              These steps will activate only after secure order and payment APIs
              are implemented.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
