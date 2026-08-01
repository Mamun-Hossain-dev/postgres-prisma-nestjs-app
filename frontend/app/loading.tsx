export default function Loading() {
  return (
    <div
      className="min-h-[70vh] px-5 py-16 lg:px-8"
      aria-busy="true"
    >
      <span className="sr-only">Loading page</span>
      <div className="h-3 w-28 animate-pulse rounded bg-black/5" />
      <div className="mt-5 h-16 max-w-xl animate-pulse rounded-3xl bg-black/5" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-[2rem] bg-black/5"
          />
        ))}
      </div>
    </div>
  );
}
