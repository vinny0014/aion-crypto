export default function Loading() {
  return (
    <div className="py-10" role="status" aria-live="polite">
      <div className="h-5 w-40 animate-pulse rounded bg-bg-soft" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="card h-32 animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Loading AION Crypto…</span>
    </div>
  );
}
