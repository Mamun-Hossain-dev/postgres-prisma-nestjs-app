'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import { Suspense, useState } from 'react';
import { useAuth } from './auth-provider';
import { ConfirmDialog } from './ui/confirm-dialog';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=MOBILE', label: 'Phones' },
  { href: '/shop?category=LAPTOP', label: 'Laptops' },
  { href: '/shop?category=AUDIO', label: 'Audio' },
  { href: '/#offers', label: 'Offers' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <Suspense
      fallback={
        <NavbarContent pathname={pathname} activeCategory={undefined} />
      }
    >
      <RouteAwareNavbar pathname={pathname} />
    </Suspense>
  );
}

function RouteAwareNavbar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();

  return (
    <NavbarContent
      pathname={pathname}
      activeCategory={searchParams.get('category')}
    />
  );
}

function NavbarContent({
  pathname,
  activeCategory,
}: {
  pathname: string;
  activeCategory: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="bg-ink px-4 py-2 text-center text-[11px] font-semibold text-white/75">
          Free delivery across Bangladesh on selected devices
          <Link
            href="/how-it-works"
            className="ml-2 text-white underline underline-offset-4"
          >
            Learn more
          </Link>
        </div>
        <div className="border-b bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-[-0.05em]"
            >
              Device<span className="text-accent">Dock</span>
            </Link>
            <nav className="hidden items-center gap-7 text-[13px] font-semibold md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={
                    isActiveLink(link.href, pathname, activeCategory)
                      ? 'page'
                      : undefined
                  }
                  className={`relative py-1 transition after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:bg-accent after:transition-transform hover:text-accent ${
                    isActiveLink(link.href, pathname, activeCategory)
                      ? 'text-accent after:scale-x-100'
                      : 'after:scale-x-0'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <Link
                href="/shop"
                className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
                aria-label="Search products"
              >
                <Search size={18} />
              </Link>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen((value) => !value)}
                    className="flex h-10 items-center gap-2 rounded-full px-1.5 pr-3 transition hover:bg-black/5"
                    aria-expanded={accountOpen}
                    aria-label="Open account menu"
                  >
                    <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-ink text-xs font-bold text-white">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <ChevronDown size={13} className="hidden sm:block" />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl border bg-white p-2 shadow-2xl">
                      <div className="border-b px-3 py-3">
                        <p className="text-sm font-bold">{user.name}</p>
                        <p className="mt-0.5 truncate text-xs text-black/40">
                          {user.email}
                        </p>
                      </div>
                      <div className="pt-2">
                        <AccountLink
                          href="/profile"
                          icon={<UserRound size={16} />}
                          label="Account overview"
                        />
                        <AccountLink
                          href="/settings"
                          icon={<Settings size={16} />}
                          label="Personal settings"
                        />
                        {user.role === 'ADMIN' && (
                          <AccountLink
                            href="/admin"
                            icon={<LayoutDashboard size={16} />}
                            label="Admin dashboard"
                          />
                        )}
                        <button
                          onClick={() => {
                            setAccountOpen(false);
                            setLogoutOpen(true);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
                  aria-label="Sign in"
                >
                  <UserRound size={19} />
                </Link>
              )}
              <Link
                href="/cart"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition hover:bg-accent"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
              </Link>
              <button
                className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5 md:hidden"
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                {open ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </div>
          {open && (
            <nav className="border-t bg-white px-5 py-3 md:hidden">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={
                    isActiveLink(link.href, pathname, activeCategory)
                      ? 'page'
                      : undefined
                  }
                  className={`flex items-center justify-between border-b py-3.5 text-sm font-bold last:border-0 ${
                    isActiveLink(link.href, pathname, activeCategory)
                      ? 'text-accent'
                      : ''
                  }`}
                >
                  {link.label} <span className="text-black/25">↗</span>
                </Link>
              ))}
              <div className="mt-3 flex gap-5 py-2 text-xs font-semibold text-black/45">
                <Link href="/about" onClick={() => setOpen(false)}>
                  About
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)}>
                  Support
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out of DeviceDock?"
        description="Your saved cart will remain linked to your account."
        confirmLabel="Sign out"
        loading={loggingOut}
        onConfirm={() => {
          setLoggingOut(true);
          void logout().finally(() => {
            setLoggingOut(false);
            setLogoutOpen(false);
            window.location.href = '/';
          });
        }}
      />
    </>
  );
}

function isActiveLink(
  href: string,
  pathname: string,
  activeCategory: string | null | undefined,
) {
  const [linkPath, query = ''] = href.split('?');
  if (
    linkPath !== pathname ||
    linkPath !== '/shop' ||
    activeCategory === undefined
  ) {
    return false;
  }

  const linkCategory = new URLSearchParams(query).get('category');
  return linkCategory
    ? linkCategory === activeCategory
    : activeCategory === null;
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5"
    >
      {icon} {label}
    </Link>
  );
}
