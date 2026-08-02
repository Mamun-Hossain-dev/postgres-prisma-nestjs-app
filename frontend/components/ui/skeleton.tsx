import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-black/[0.065] motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading products"
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[4/5] rounded-[2rem]" />
          <Skeleton className="mt-4 h-3 w-20" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" aria-label="Loading content" role="status">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-5 sm:px-7">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3 w-3/5" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]" role="status">
      <div className="rounded-[2rem] border bg-white/45 p-7">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-5 h-12 w-3/5" />
        <Skeleton className="mt-8 h-5 w-full" />
        <Skeleton className="mt-3 h-5 w-5/6" />
        <Skeleton className="mt-10 h-52 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-[2rem]" />
      <span className="sr-only">Loading details…</span>
    </div>
  );
}
