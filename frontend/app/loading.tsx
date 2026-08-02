import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-[70vh] px-5 py-16 lg:px-8" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-5 h-16 max-w-xl rounded-3xl" />
      <div className="mt-12">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
