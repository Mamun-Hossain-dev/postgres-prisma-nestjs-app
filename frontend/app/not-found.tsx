import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          404 · Not found
        </p>
        <h1 className="display mt-3 text-6xl sm:text-7xl">
          Lost between the docks.
        </h1>
        <p className="mx-auto mt-5 max-w-md leading-7 text-black/50">
          The page may have moved, or the address may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-white hover:bg-accent"
        >
          <ArrowLeft size={17} /> Return home
        </Link>
      </div>
    </div>
  );
}
