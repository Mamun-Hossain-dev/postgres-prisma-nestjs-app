'use client';

import Link from 'next/link';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './auth-provider';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=MOBILE', label: 'Phones' },
  { href: '/shop?category=LAPTOP', label: 'Computers' },
  { href: '/shop?category=AUDIO', label: 'Audio' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="display text-2xl font-bold">
          Device<span className="text-accent">Dock</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border bg-white/55 py-1.5 pl-1.5 pr-3 text-sm font-semibold"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl border bg-paper p-2 shadow-soft">
                  <p className="px-3 py-2 text-xs text-black/45">
                    {user.email}
                  </p>
                  <AccountLink
                    href="/profile"
                    icon={<UserRound size={16} />}
                    label="Profile"
                  />
                  <AccountLink
                    href="/settings"
                    icon={<Settings size={16} />}
                    label="Settings"
                  />
                  {user.role === 'ADMIN' && (
                    <AccountLink
                      href="/admin"
                      icon={<LayoutDashboard size={16} />}
                      label="Admin dashboard"
                    />
                  )}
                  <button
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full p-2 hover:bg-black/5"
              aria-label="Sign in"
            >
              <UserRound size={20} />
            </Link>
          )}
          <Link
            href="/cart"
            className="rounded-full bg-ink p-2.5 text-white hover:bg-accent"
            aria-label="Cart"
          >
            <ShoppingBag size={19} />
          </Link>
          <button
            className="rounded-full p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-paper px-5 py-5 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b py-3 text-lg"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function AccountLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5"
    >
      {icon} {label}
    </Link>
  );
}
