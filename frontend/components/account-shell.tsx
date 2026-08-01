'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Heart,
  Home,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();

  const confirmLogout = async () => {
    setLoggingOut(true);
    await logout();
    window.location.href = '/login';
  };

  const sidebar = (
    <aside className="flex h-full min-h-screen flex-col bg-ink p-4 text-white">
      <Link
        href="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-3 px-3 py-4"
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent">
          <ShoppingBag size={19} />
        </span>
        <span>
          <span className="display block text-xl">DeviceDock</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-white/40">
            My account
          </span>
        </span>
      </Link>
      <nav className="mt-5 grid gap-1" aria-label="Account">
        {items.map(({ id, href, label, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              active === id
                ? 'bg-white text-ink'
                : 'text-white/55 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto grid gap-1">
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <Settings size={16} /> Admin panel
          </Link>
        )}
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold">Back to the store</p>
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
          >
            <Home size={14} /> Go home
          </Link>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#ebe6da] lg:grid lg:grid-cols-[270px_1fr]">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 w-[270px] overflow-y-auto">
          {sidebar}
        </div>
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative h-full w-[280px] max-w-[85vw] overflow-y-auto shadow-2xl">
            <button
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-white hover:bg-white/10"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
            >
              <X />
            </button>
            {sidebar}
          </div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b bg-[#ebe6da]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 hover:bg-black/5 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div className="hidden items-center gap-2 rounded-full border bg-white/45 px-4 py-2.5 text-black/35 md:flex">
              <Search size={16} />
              <span className="text-xs">Your account</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-black/40">
                {user?.role}
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
            <Button
              variant="ghost"
              className="h-10 w-10 px-0"
              onClick={() => setLogoutOpen(true)}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        <main className="container mx-auto p-5 sm:p-8">{children}</main>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out of DeviceDock?"
        description="You will need to sign in again to access your account."
        confirmLabel="Sign out"
        onConfirm={() => void confirmLogout()}
        loading={loggingOut}
      />
    </div>
  );
}
