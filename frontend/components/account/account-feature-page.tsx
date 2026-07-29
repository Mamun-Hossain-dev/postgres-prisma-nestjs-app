import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { AccountShell, type AccountSection } from '@/components/account-shell';

export function AccountFeaturePage({
  active,
  eyebrow,
  title,
  description,
  icon,
  note,
}: {
  active: AccountSection;
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  note: string;
}) {
  return (
    <AccountShell active={active}>
      <section className="overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="bg-ink p-7 text-white sm:p-10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
            {icon}
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-white/40">
            {eyebrow}
          </p>
          <h2 className="display mt-2 text-5xl">{title}</h2>
          <p className="mt-4 max-w-xl leading-7 text-white/55">{description}</p>
        </div>
        <div className="p-7 sm:p-10">
          <div className="rounded-2xl border border-dashed bg-paper p-6">
            <p className="text-sm font-bold">Backend integration pending</p>
            <p className="mt-2 text-sm leading-6 text-black/50">{note}</p>
          </div>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold"
          >
            Continue shopping <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </AccountShell>
  );
}
