import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className = '',
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge-strong px-6 py-12 text-center ${className}`}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-raised text-soft">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-soft">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
