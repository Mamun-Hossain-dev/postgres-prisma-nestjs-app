'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div className="max-w-lg">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle />
        </span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Unexpected error
        </p>
        <h1 className="display mt-2 text-5xl">That did not go to plan.</h1>
        <p className="mt-4 leading-7 text-black/50">
          {error.message || 'Please try the page again.'}
        </p>
        <Button onClick={reset} className="mt-7">
          <RotateCcw size={17} /> Try again
        </Button>
      </div>
    </div>
  );
}
