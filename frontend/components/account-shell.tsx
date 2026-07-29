import Link from 'next/link';
import {
  Bell,
  Heart,
  Home,
  LockKeyhole,
  MapPin,
  Package,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { id: 'overview', href: '/profile', label: 'Overview', icon: Home },
  {
    id: 'personal',
    href: '/settings',
    label: 'Personal information',
    icon: Settings,
  },
  {
    id: 'addresses',
    href: '/account/addresses',
    label: 'Addresses',
    icon: MapPin,
  },
  { id: 'orders', href: '/account/orders', label: 'Orders', icon: Package },
  { id: 'wishlist', href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  {
    id: 'notifications',
    href: '/account/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    id: 'security',
    href: '/account/security',
    label: 'Security',
    icon: LockKeyhole,
  },
] as const;

export type AccountSection = (typeof items)[number]['id'];

export function AccountShell({
  active,
  children,
}: {
  active: AccountSection;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Your account
        </p>
        <h1 className="display mt-2 text-4xl">Account center.</h1>
      </div>
      <div className="grid gap-7 lg:grid-cols-[270px_1fr]">
        <aside className="h-fit overflow-x-auto rounded-[1.75rem] bg-ink p-3 text-white lg:sticky lg:top-28">
          <nav
            className="flex min-w-max gap-1 lg:grid lg:min-w-0"
            aria-label="Account"
          >
            {items.map(({ id, href, label, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                  active === id
                    ? 'bg-white text-ink'
                    : 'text-white/55 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
