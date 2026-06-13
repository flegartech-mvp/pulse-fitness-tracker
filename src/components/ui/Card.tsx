import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-edge bg-surface shadow-card ${className}`}
      {...rest}
    />
  )
}

/** Card that reads as clickable (used with onClick or wrapped in a Link). */
export function InteractiveCard({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-edge bg-surface shadow-card transition hover:border-edge-strong hover:bg-raised ${className}`}
      {...rest}
    />
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-0">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
