"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="font-display text-6xl font-bold text-accent-red">500</div>
      <h1 className="mt-3 text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-dim">An unexpected error occurred while rendering this page. Your data is safe.</p>
      <button onClick={reset} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">Try again</button>
    </div>
  );
}
