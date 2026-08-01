'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function visiblePages(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  return [...pages]
    .filter((item) => item > 0 && item <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange(page: number): void;
}) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(page, totalPages);
  const goToPage = (nextPage: number) => {
    if (nextPage !== page && nextPage >= 1 && nextPage <= totalPages) {
      onPageChange(nextPage);
    }
  };

  return (
    <nav
      className="flex flex-col gap-4 border-t border-black/10 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      aria-label="Pagination"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-black/40 sm:text-left">
        Page <span className="text-ink">{page}</span>
        <span className="mx-1.5 text-black/20">/</span>
        {totalPages}
      </p>

      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-1 rounded-full border bg-white/65 px-3 text-xs font-bold transition hover:border-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 sm:px-4"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {pages.map((item, index) => {
            const previousPage = pages[index - 1];

            return (
              <div key={item} className="flex items-center gap-1.5">
                {previousPage && item - previousPage > 1 && (
                  <span className="grid h-10 w-6 place-items-center text-sm text-black/35">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => goToPage(item)}
                  aria-label={`Go to page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'grid h-10 min-w-10 place-items-center rounded-full border px-3 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                    item === page
                      ? 'border-ink bg-ink text-white shadow-sm'
                      : 'bg-white/65 text-ink hover:border-accent hover:bg-white hover:text-accent',
                  )}
                >
                  {item}
                </button>
              </div>
            );
          })}
        </div>

        <span className="grid h-10 min-w-14 place-items-center rounded-full bg-ink px-3 text-xs font-bold text-white sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-1 rounded-full border bg-white/65 px-3 text-xs font-bold transition hover:border-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 sm:px-4"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
