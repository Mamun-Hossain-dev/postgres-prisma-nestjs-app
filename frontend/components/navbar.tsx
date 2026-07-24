'use client';

import Link from 'next/link';
import { LogOut, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
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
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="display text-2xl font-bold">
          Device<span className="text-accent">Dock</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => void logout()}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm sm:flex"
            >
              <LogOut size={17} />
              {user.name.split(' ')[0]}
            </button>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="rounded-full p-2 hover:bg-black/5"
            >
              <UserRound size={20} />
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Cart"
            className="rounded-full bg-ink p-2.5 text-white hover:bg-accent"
          >
            <ShoppingBag size={19} />
          </Link>
          <button
            className="rounded-full p-2 md:hidden"
            onClick={() => setOpen((value) => !value)}
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
