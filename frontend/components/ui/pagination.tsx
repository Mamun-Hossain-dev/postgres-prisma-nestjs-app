'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

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

  return (
    <nav
      className="flex items-center justify-between border-t px-5 py-4"
      aria-label="Pagination"
    >
      <p className="text-xs text-black/45">
        Page <strong className="text-ink">{page}</strong> of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-9 px-3"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} /> Previous
        </Button>
        <Button
          variant="outline"
          className="h-9 px-3"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
