'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  UsersRound,
  Warehouse,
  MessagesSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primary = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/users', label: 'Customers', icon: UsersRound },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

const operations = [
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
];

const system = [
  { href: '/admin/notifications', label: 'Broadcasts', icon: Bell },
  { href: '/admin/contact', label: 'Messages', icon: MessagesSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-screen flex-col bg-ink p-4 text-white">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-4"
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent">
          <ShoppingBag size={19} />
        </span>
        <span>
          <span className="display block text-xl">DeviceDock</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
            Admin
          </span>
        </span>
      </Link>
      <NavGroup items={primary} pathname={pathname} onNavigate={onNavigate} />
      <NavGroup
        title="Operations"
        items={operations}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <NavGroup
        title="System"
        items={system}
        pathname={pathname}
        onNavigate={onNavigate}
      />
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold">Need storefront view?</p>
        <Link
          href="/"
          className="mt-2 inline-block text-xs text-white/50 hover:text-white"
        >
          Open DeviceDock ↗
        </Link>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: typeof primary;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="mt-5 grid gap-1" aria-label={title ?? 'Main admin'}>
      {title && (
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
          {title}
        </p>
      )}
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              active
                ? 'bg-white text-ink'
                : 'text-white/55 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
