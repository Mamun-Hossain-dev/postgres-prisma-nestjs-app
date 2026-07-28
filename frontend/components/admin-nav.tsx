'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, ShoppingBag, UsersRound } from 'lucide-react';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Customers', icon: UsersRound },
  { href: '/admin/products', label: 'Catalog', icon: Boxes },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="rounded-[2rem] bg-ink p-4 text-white lg:sticky lg:top-28 lg:h-fit">
      <div className="px-4 pb-6 pt-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent">
          <ShoppingBag size={20} />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
          Control room
        </p>
        <p className="display mt-1 text-2xl">DeviceDock Admin</p>
      </div>
      <nav className="grid gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${active ? 'bg-white text-ink' : 'text-white/60 hover:bg-white/10'}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
