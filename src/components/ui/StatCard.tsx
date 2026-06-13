import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

/** Compact dashboard stat with icon, big number, and an optional delta/footnote. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = 'var(--c-accent)',
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: ReactNode
  iconColor?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-soft">
        <span
          className="flex size-7 items-center justify-center rounded-lg"
          style={{ color: iconColor, background: `color-mix(in srgb, ${iconColor} 12%, transparent)` }}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="truncate text-xs font-medium">{label}</span>
      </div>
      <p className="tnum mt-3 truncate text-2xl font-bold tracking-tight text-ink">{value}</p>
      {sub ? <div className="mt-1 text-xs text-soft">{sub}</div> : null}
    </Card>
  )
}

export function DeltaTag({ delta, goodWhen = 'up' }: { delta: number; goodWhen?: 'up' | 'down' }) {
  if (!Number.isFinite(delta) || delta === 0) return <span className="text-faint">no change</span>
  const up = delta > 0
  const good = goodWhen === 'up' ? up : !up
  return (
    <span className={`tnum font-semibold ${good ? 'text-success' : 'text-danger'}`}>
      {up ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))}%
    </span>
  )
}
