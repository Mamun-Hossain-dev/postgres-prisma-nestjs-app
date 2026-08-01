'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname === '/profile' ||
    pathname === '/settings';

  if (isStandalone) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="container mx-auto">{children}</main>
      <Footer />
    </>
  );
}
