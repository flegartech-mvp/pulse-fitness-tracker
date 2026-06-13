/** Pulsing placeholder used while a lazy route chunk loads. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-48 rounded-lg bg-raised" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-raised" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-raised" />
      <div className="h-40 rounded-2xl bg-raised" />
    </div>
  )
}
