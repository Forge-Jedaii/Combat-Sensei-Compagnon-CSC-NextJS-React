export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement de la page…</span>
      <div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-white/10" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
    </main>
  );
}
