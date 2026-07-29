import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const columns = [
  {
    title: 'Shop',
    links: [
      ['/shop', 'All products'],
      ['/shop?category=MOBILE', 'Phones'],
      ['/shop?category=LAPTOP', 'Laptops'],
      ['/shop?category=AUDIO', 'Audio'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['/profile', 'Overview'],
      ['/cart', 'Your cart'],
      ['/account/orders', 'Orders'],
      ['/account/security', 'Security'],
    ],
  },
  {
    title: 'DeviceDock',
    links: [
      ['/about', 'About'],
      ['/how-it-works', 'How it works'],
      ['/contact', 'Contact & support'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#09090b] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 lg:px-8">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-[-0.05em]"
            >
              Device<span className="text-[#e58055]">Dock</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/45">
              Premium electronics, clear specifications and a simpler way to
              choose your next device.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white"
            >
              Explore the store <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                  {column.title}
                </p>
                <div className="mt-5 grid gap-3.5 text-sm">
                  {column.links.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-white/65 transition hover:text-white"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DeviceDock. Built for Bangladesh.</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
