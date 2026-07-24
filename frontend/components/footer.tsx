import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3 lg:px-8">
        <div>
          <p className="display text-3xl font-bold">
            Device<span className="text-accent">Dock</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            Thoughtfully selected technology, honest specifications and a
            simpler way to find your next device.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Explore
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/shop">All products</Link>
            <Link href="/shop?category=MOBILE">Phones</Link>
            <Link href="/shop?category=LAPTOP">Laptops</Link>
          </div>
        </div>
        <div className="md:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Built for Bangladesh
          </p>
          <p className="mt-4 text-sm text-white/60">
            Authentic products · Clear pricing · Secure accounts
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © 2026 DeviceDock. Order and payment flows are coming next.
      </div>
    </footer>
  );
}
